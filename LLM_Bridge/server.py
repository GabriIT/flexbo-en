# LLM_Bridge/server.py
import os
import time
import threading
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
MODEL_NAME      = os.getenv("OLLAMA_MODEL", "tinyllama:1.1b-chat-v1-q4_0")
EMBED_MODEL     = os.getenv("EMBED_MODEL", "nomic-embed-text")
OLLAMA_URL      = os.getenv("OLLAMA_BASE_URL") or os.getenv("OLLAMA_HOST") or "http://127.0.0.1:11434"
API_KEY         = os.getenv("API_KEY", "secret")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"
ALLOW_ORIGINS   = os.getenv("ALLOW_ORIGINS", "*").split(",")

FAQ_SIM_THRESHOLD = float(os.getenv("FAQ_SIM_THRESHOLD", "0.35"))

app = FastAPI(title="Flexbo LLM + FAQ Backend", version="2.1.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _ollama_llm() -> Ollama:
    return Ollama(model=MODEL_NAME, base_url=OLLAMA_URL)

def _score_to_similarity(score: float) -> float:
    """
    Normalize FAISS score to similarity in [0,1] (higher is better).
    - If score > 1.0, treat it as a distance -> sim = 1/(1+score)
    - Else, treat it as cosine-distance -> sim = 1 - score
    """
    try:
        s = float(score)
    except Exception:
        return 0.0
    if s > 1.0:
        return 1.0 / (1.0 + s)       # <-- this return was missing
    return max(0.0, min(1.0, 1.0 - s))

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
FAQ_PROMPT = ChatPromptTemplate.from_template(
    "Answer the user directly using the FAQ answer. Do not mention that you used an FAQ.\n\n"
    "USER QUESTION:\n{question}\n\n"
    "FAQ PAIR:\nQ: {faq_q}\nA: {faq_a}\n\n"
    "Final answer:"
)

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

    # 1) retrieve
    try:
        vs = get_faq_vs()
        pairs: List[Tuple] = vs.similarity_search_with_score(req.message, k=3)
        sims = [(d, _score_to_similarity(s)) for d, s in pairs]
        sims.sort(key=lambda x: x[1], reverse=True)
        print("[FAQ DEBUG]", [(d.page_content[:40], f"{sim:.3f}") for d, sim in sims])
    except Exception as e:
        sims = []
        print(f"[FAQ RETRIEVAL ERROR] {e}")

    # 2) threshold
    if sims:
        best_doc, best_sim = sims[0]
        if best_sim >= FAQ_SIM_THRESHOLD:
            faq_q = best_doc.page_content
            faq_a = best_doc.metadata.get("answer", "")
            try:
                out = StrOutputParser().invoke(
                    _ollama_llm().invoke(FAQ_PROMPT.format_messages(
                        question=req.message, faq_q=faq_q, faq_a=faq_a
                    ))
                )
            except Exception:
                out = faq_a
            with _lock:
                _threads[tid]["messages"].append({"type": "bot", "content": out})
                messages = [Message(**m) for m in _threads[tid]["messages"]]
            return ChatResponse(thread_id=tid, response=out,
                                elapsed_ms=int((time.time()-start)*1000), messages=messages)

    # 3) fallback
    fallback = os.getenv(
        "CONTACT_MESSAGE",
        "This seems outside my current knowledge base. Please reach out via the Contact page (/contact) and we’ll get back to you quickly."
    )
    with _lock:
        _threads[tid]["messages"].append({"type": "bot", "content": fallback})
        messages = [Message(**m) for m in _threads[tid]["messages"]]
    return ChatResponse(thread_id=tid, response=fallback,
                        elapsed_ms=int((time.time()-start)*1000), messages=messages)

@app.get("/api/debug/sim")
def debug_sim(q: str = Query(..., min_length=1)):
    vs = get_faq_vs()
    pairs: List[Tuple] = vs.similarity_search_with_score(q, k=5)
    def norm(score: float) -> float:
        s = float(score)
        return 1.0/(1.0+s) if s > 1.0 else 1.0 - s
    out = []
    for doc, score in pairs:
        out.append({
            "q": doc.page_content[:160],
            "a": doc.metadata.get("answer","")[:160],
            "raw_score": float(score),
            "sim": round(norm(score), 4),
        })
    return {"query": q, "results": out}

@app.on_event("startup")
def _warm_faiss():
    global faq_vs
    try:
        vs, _ = build_or_load_vectorstore()
        faq_vs = vs
        print(f"[STARTUP] FAISS loaded. ntotal={int(faq_vs.index.ntotal)}")
    except Exception as e:
        # Don’t crash the app; just log. You can curl /api/knowledge/reload later.
        print(f"[STARTUP] FAISS load/build failed: {e}")
