# LLM_Bridge/server.py
import os
import re
import time
import threading
import traceback
import requests
from typing import Dict, List, Optional, Tuple

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.vectorstores import FAISS

from .knowledge_loader import build_or_load_vectorstore, reload_vectorstore

# --- Env ---
MODEL_NAME       = os.getenv("OLLAMA_MODEL", "tinyllama:1.1b-chat-v1-q4_0")
EMBED_MODEL      = os.getenv("EMBED_MODEL", "nomic-embed-text")
OLLAMA_URL       = os.getenv("OLLAMA_BASE_URL") or os.getenv("OLLAMA_HOST") or "http://127.0.0.1:11434"
API_KEY          = os.getenv("API_KEY", "secret")
REQUIRE_API_KEY  = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"
ALLOW_ORIGINS    = os.getenv("ALLOW_ORIGINS", "*").split(",")

FAQ_SIM_THRESHOLD = float(os.getenv("FAQ_SIM_THRESHOLD", "0.35"))
FAQ_USE_REWRITER  = os.getenv("FAQ_USE_REWRITER", "false").lower() == "true"  # default OFF

# --- App ---
app = FastAPI(title="Flexbo LLM + FAQ Backend", version="2.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helpers ---
def _ollama_llm() -> Ollama:
    # Always pass base_url to avoid implicit localhost
    return Ollama(model=MODEL_NAME, base_url=OLLAMA_URL)

def _score_to_similarity(score: float) -> float:
    """
    Normalize FAISS score to similarity in [0,1] (higher is better).
    - If score > 1.0, assume 'distance' -> sim = 1/(1+score)
    - Else, assume 'cosine distance' in [0,1] -> sim = 1 - score
    """
    try:
        s = float(score)
    except Exception:
        return 0.0
    if s > 1.0:
        return 1.0 / (1.0 + s)
    return max(0.0, min(1.0, 1.0 - s))

def _clean_answer(text: str) -> str:
    """Trim quotes/markdown and drop meta-headings if present."""
    t = (text or "").strip()

    # Drop lines that look like meta headings (defensive)
    cleaned_lines = []
    for line in t.splitlines():
        if re.match(r"^\s*(task|user\s*question|answer|final\s*reply)\b", line, re.I):
            continue
        cleaned_lines.append(line)
    t = " ".join(cleaned_lines).strip()

    # Strip simple wrapping quotes/backticks
    if len(t) >= 2 and t[0] in {'"', "'", "“", "‘", "`"} and t[-1] in {'"', "'", "”", "’", "`"}:
        t = t[1:-1].strip()

    # Collapse excessive spaces
    t = re.sub(r"\s{2,}", " ", t)
    return t

# Optional rewriter (only used if FAQ_USE_REWRITER=true)
FAQ_PROMPT = ChatPromptTemplate.from_template(
    """
You are a FLEXBO product specialist. Your job is to deliver a polished final reply for a customer.

STRICT RULES:
- Use ONLY the content in ANSWER.
- Do NOT mention FAQ, sources, records, context, or your process.
- Do NOT include meta text like "Task:", "User Question:", "Answer:", or "Final reply".
- Keep numbers/units exactly as given.
- Fix minor grammar/typos only; DO NOT add new facts.
- Prefer one short paragraph or a short bullet list.

USER QUESTION:
{question}

ANSWER:
{faq_a}

Write the final reply (no headings, no meta text):
"""
)

def build_llm_chain():
    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are FLEXBO Assistant. Speak like a helpful product specialist. "
         "Answer directly, without prefacing how you derived the answer."),
        ("user", "Prompt: {query}")
    ])
    return prompt | _ollama_llm() | StrOutputParser()

chain = build_llm_chain()

# --- Vector store ---
faq_vs: Optional[FAISS] = None
faq_lock = threading.Lock()

def get_faq_vs() -> FAISS:
    global faq_vs
    with faq_lock:
        if faq_vs is None:
            faq_vs, _ = build_or_load_vectorstore()
        return faq_vs

# --- Models ---
class CreateThreadRequest(BaseModel):
    content: str = Field(..., min_length=1)

class Message(BaseModel):
    type: str
    content: str

class ThreadMessagesResponse(BaseModel):
    messages: List[Message]

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    thread_id: Optional[int] = None

class ChatResponse(BaseModel):
    thread_id: int
    response: str
    elapsed_ms: int
    messages: List[Message]

def _guard_api_key(headers) -> None:
    if not REQUIRE_API_KEY:
        return
    if headers.get("x-api-key") != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

# --- Health/Admin ---
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "embed_model": EMBED_MODEL,
        "ollama_url": OLLAMA_URL,
    }

@app.get("/api/debug/faiss")
def debug_faiss():
    vs = get_faq_vs()
    return {"ntotal": int(vs.index.ntotal) if vs else 0}

@app.post("/api/knowledge/reload")
def knowledge_reload(csv_path: Optional[str] = Query(default=None)):
    global faq_vs
    with faq_lock:
        faq_vs = reload_vectorstore(csv_path)
    return {"status": "reloaded", "count": int(faq_vs.index.ntotal) if faq_vs else 0}

# --- Chat ---
_threads: Dict[int, Dict] = {}
_next_id = 1
_lock = threading.Lock()

@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest, request: Request):
    _guard_api_key(request.headers)
    start = time.time()

    with _lock:
        global _next_id
        tid = req.thread_id or _next_id
        if req.thread_id is None:
            _next_id += 1
            _threads[tid] = {"messages": []}
        _threads[tid]["messages"].append({"type": "user", "content": req.message})

    # 1) retrieve similar FAQs
    try:
        vs = get_faq_vs()
        pairs: List[Tuple] = vs.similarity_search_with_score(req.message, k=3)
        sims = [(d, _score_to_similarity(s)) for d, s in pairs]
        sims.sort(key=lambda x: x[1], reverse=True)
        print("[FAQ DEBUG]", [(d.page_content[:40], f"{sim:.3f}") for d, sim in sims])
    except Exception as e:
        sims = []
        print(f"[FAQ RETRIEVAL ERROR] {e}")
        traceback.print_exc()  # <-- add this for visibility
        

    # 2) threshold -> use CSV answer (default) or LLM rewriter (optional)
    if sims:
        best_doc, best_sim = sims[0]
        if best_sim >= FAQ_SIM_THRESHOLD:
            faq_a = best_doc.metadata.get("answer", "") or ""

            if FAQ_USE_REWRITER:
                try:
                    messages = FAQ_PROMPT.format_messages(question=req.message, faq_a=faq_a)
                    ai_msg = _ollama_llm().invoke(messages)
                    out = _clean_answer(getattr(ai_msg, "content", str(ai_msg)) or faq_a)
                except Exception:
                    out = _clean_answer(faq_a)
            else:
                out = _clean_answer(faq_a)

            with _lock:
                _threads[tid]["messages"].append({"type": "bot", "content": out})
                messages = [Message(**m) for m in _threads[tid]["messages"]]
            return ChatResponse(
                thread_id=tid,
                response=out,
                elapsed_ms=int((time.time() - start) * 1000),
                messages=messages,
            )

    # 3) fallback
    fallback = os.getenv(
        "CONTACT_MESSAGE",
        "This seems outside my current knowledge base. Please reach out via the Contact page (/contact) and we’ll get back to you quickly."
    )
    with _lock:
        _threads[tid]["messages"].append({"type": "bot", "content": fallback})
        messages = [Message(**m) for m in _threads[tid]["messages"]]
    return ChatResponse(
        thread_id=tid,
        response=fallback,
        elapsed_ms=int((time.time() - start) * 1000),
        messages=messages,
    )

# --- Debug Similarity ---
@app.get("/api/debug/sim")
def debug_sim(q: str = Query(..., min_length=1)):
    vs = get_faq_vs()
    pairs: List[Tuple] = vs.similarity_search_with_score(q, k=5)

    def norm(score: float) -> float:
        s = float(score)
        return 1.0 / (1.0 + s) if s > 1.0 else 1.0 - s

    out = []
    for doc, score in pairs:
        out.append({
            "q": doc.page_content[:160],
            "a": doc.metadata.get("answer", "")[:160],
            "raw_score": float(score),
            "sim": round(norm(score), 4),
        })
    return {"query": q, "results": out}

# --- Debug embeddings ping ---
@app.get("/api/debug/embed-ping")
def embed_ping():
    try:
        # a tiny “do you embed?” check through Ollama’s embeddings path
        # LangChain hides it; we'll just do a raw ping
        base = OLLAMA_URL.rstrip("/")
        r = requests.post(f"{base}/api/embeddings", json={"model": os.getenv("EMBED_MODEL", "nomic-embed-text"), "prompt": "ping"})
        ok = (r.status_code == 200) and "embedding" in r.json()
        return {"ok": ok, "status": r.status_code, "len": len(r.json().get("embedding", []))}
    except Exception as e:
        return {"ok": False, "error": str(e)}




# --- Startup warmup ---
@app.on_event("startup")
def _warm_faiss():
    global faq_vs
    try:
        vs, _ = build_or_load_vectorstore()
        faq_vs = vs
        print(f"[STARTUP] FAISS loaded. ntotal={int(faq_vs.index.ntotal)}")
    except Exception as e:
        print(f"[STARTUP] FAISS load/build failed: {e}")

# --- Debug echo (for proxy tests) ---
@app.post("/api/debug/echo")
def echo(payload: dict):
    return payload
