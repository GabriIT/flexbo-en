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

# ---------------- Env ----------------
MODEL_NAME      = os.getenv("OLLAMA_MODEL", "tinyllama:1.1b-chat-v1-q4_0")
EMBED_MODEL     = os.getenv("EMBED_MODEL", "nomic-embed-text")
OLLAMA_URL      = os.getenv("OLLAMA_BASE_URL") or os.getenv("OLLAMA_HOST") or "http://127.0.0.1:11434"
API_KEY         = os.getenv("API_KEY", "secret")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"
ALLOW_ORIGINS   = os.getenv("ALLOW_ORIGINS", "*").split(",")

# threshold is on a 0..1 similarity scale (higher is better)
FAQ_SIM_THRESHOLD = float(os.getenv("FAQ_SIM_THRESHOLD", "0.35"))
WEB_SNIPPETS      = int(os.getenv("WEB_SNIPPETS", "3"))

CONTACT_MESSAGE = os.getenv(
    "CONTACT_MESSAGE",
    "This seems outside my current knowledge base. Please reach out via the Contact page (/contact) and we’ll get back to you quickly."
)

# ---------------- App ----------------
app = FastAPI(title="Flexbo LLM + FAQ Backend", version="2.1.0")
app.add_middleware(
    CORSMiddleware(
        CORSMiddleware,
        allow_origins=ALLOW_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
)

# ---------------- Helpers ----------------
def _ollama_llm() -> Ollama:
    return Ollama(model=MODEL_NAME, base_url=OLLAMA_URL)

def _score_to_similarity(score: float) -> float:
    """Cosine distance → similarity in [0,1]."""
    try:
        s = float(score)
    except Exception:
        return 0.0
    return max(0.0, min(1.0, 1.0 - s))

# ---------------- LLM Chain ----------------
def build_llm_chain():
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system",
             "You are FLEXBO Assistant. Speak like a helpful product specialist. "
             "Be concise, confident, and client-oriented. Never mention 'context', 'snippets', "
             "or your internal reasoning. Avoid hedging or apologies unless necessary."),
            ("user", "Prompt: {query}")
        ]
    )
    llm = _ollama_llm()
    return prompt | llm | StrOutputParser()

chain = build_llm_chain()

# ---------------- FAQ Vector Store ----------------
faq_vs: Optional[FAISS] = None
faq_lock = threading.Lock()

def get_faq_vs() -> FAISS:
    global faq_vs
    with faq_lock:
        if faq_vs is None:
            faq_vs, _ = build_or_load_vectorstore()
        return faq_vs

# ---------------- In-memory threads (simple) ----------------
_threads: Dict[int, Dict] = {}
_next_id = 1
_lock = threading.Lock()

class CreateThreadRequest(BaseModel):
    content: str = Field(..., min_length=1)

class Message(BaseModel):
    type: str   # 'user' | 'bot'
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

# ---------------- Health & Admin ----------------
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

# ---------------- Chat Flow ----------------
FAQ_PROMPT = ChatPromptTemplate.from_template(
    "You are a helpful assistant. You are given a user question and the most relevant FAQ pair.\n"
    "Answer **directly** and **concisely** using the FAQ answer. Do **not** add prefaces like "
    "'Based on the given FAQ...' or mention that you used an FAQ. Do not invent new facts.\n\n"
    "USER QUESTION:\n{question}\n\n"
    "FAQ PAIR:\nQ: {faq_q}\nA: {faq_a}\n\n"
    "Final answer (one paragraph max):"
)

@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest, request: Request):
    _guard_api_key(request.headers)
    start = time.time()

    # Ensure thread
    with _lock:
        tid = req.thread_id
        if tid is None:
            global _next_id
            tid = _next_id
            _next_id += 1
            _threads[tid] = {"messages": []}
        if tid not in _threads:
            raise HTTPException(status_code=404, detail="Thread not found")
        _threads[tid]["messages"].append({"type": "user", "content": req.message})

    # ------- 1) Try FAQ retrieval -------
    try:
        vs = get_faq_vs()
        similar: List[Tuple] = vs.similarity_search_with_score(req.message, k=3)
        sims = [(d, _score_to_similarity(s)) for d, s in similar]
        sims.sort(key=lambda x: x[1], reverse=True)
        print("[FAQ DEBUG]", [(d.metadata.get("answer","")[:30], f"{sim:.3f}") for d, sim in sims])
    except Exception as e:
        sims = []
        print(f"[FAQ RETRIEVAL ERROR] {e}")

    if sims:
        best_doc, best_sim = sims[0]
        if best_sim >= FAQ_SIM_THRESHOLD:
            faq_q = best_doc.page_content
            faq_a = best_doc.metadata.get("answer", "")
            # Either rephrase with LLM or return faq_a directly
            try:
                output = (_ollama_llm()
                          .invoke(FAQ_PROMPT.format(question=req.message, faq_q=faq_q, faq_a=faq_a)))
                # If your Ollama binding returns a Message, unwrap to str if needed:
                if hasattr(output, "content"):
                    output = output.content
            except Exception:
                output = faq_a

            with _lock:
                _threads[tid]["messages"].append({"type": "bot", "content": str(output)})
                messages = [Message(**m) for m in _threads[tid]["messages"]]
            elapsed_ms = int((time.time() - start) * 1000)
            return ChatResponse(thread_id=tid, response=str(output), elapsed_ms=elapsed_ms, messages=messages)

    # ------- 2) Fallback -------
    output = CONTACT_MESSAGE
    with _lock:
        _threads[tid]["messages"].append({"type": "bot", "content": output})
        messages = [Message(**m) for m in _threads[tid]["messages"]]
    elapsed_ms = int((time.time() - start) * 1000)
    return ChatResponse(thread_id=tid, response=output, elapsed_ms=elapsed_ms, messages=messages)

# ---------------- Debug Similarity ----------------
@app.get("/api/debug/sim")
def debug_sim(q: str = Query(..., min_length=1)):
    vs = get_faq_vs()
    pairs: List[Tuple] = vs.similarity_search_with_score(q, k=5)
    def norm(score: float) -> float:
        s = float(score)
        return max(0.0, min(1.0, 1.0 - s))  # cosine distance -> similarity
    out = []
    for doc, score in pairs:
        out.append({
            "q": doc.page_content[:160],
            "a": doc.metadata.get("answer","")[:160],
            "raw_score": float(score),
            "sim": round(norm(score), 4),
        })
    return {"query": q, "results": out}
