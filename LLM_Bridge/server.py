# LLM_Bridge/server.py
import os
import time
import threading
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# from duckduckgo_search import DDGS  # optional web search
from langchain_community.vectorstores import FAISS

from knowledge_loader import build_or_load_vectorstore, reload_vectorstore

MODEL_NAME = os.getenv("OLLAMA_MODEL", "tinyllama:1.1b-chat-v1-q4_0")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
API_KEY = os.getenv("API_KEY", "secret")
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"

FAQ_CONFIDENCE = float(os.getenv("FAQ_CONFIDENCE", "0.70"))   # cosine sim, 0..1
# ENABLE_WEB_SEARCH = os.getenv("ENABLE_WEB_SEARCH", "false").lower() == "true"
WEB_SNIPPETS = int(os.getenv("WEB_SNIPPETS", "3"))

CONTACT_MESSAGE = os.getenv(
    "CONTACT_MESSAGE",
    "This seems outside my current knowledge base. Please reach out via the Contact page (/contact) and we’ll get back to you quickly."
)

# ---------------- App ----------------
app = FastAPI(title="Flexbo LLM + FAQ Backend", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    llm = Ollama(model=MODEL_NAME)   # Uses OLLAMA_HOST if set
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
        "web_search": ENABLE_WEB_SEARCH,
    }

@app.post("/api/knowledge/reload")
def knowledge_reload(csv_path: Optional[str] = Query(default=None)):
    # Optional API key guard here if you want
    global faq_vs
    with faq_lock:
        faq_vs = reload_vectorstore(csv_path)
    return {"status": "reloaded", "count": faq_vs.index.ntotal if faq_vs else 0}

# ---------------- Threads (optional) ----------------
@app.post("/api/thread", response_model=Dict[str, int])
def create_thread(req: CreateThreadRequest, request: Request):
    _guard_api_key(request.headers)
    with _lock:
        global _next_id
        tid = _next_id
        _next_id += 1
        _threads[tid] = {"messages": [Message(type="user", content=req.content).model_dump()]}
    return {"id": tid}

@app.get("/api/thread/{thread_id}", response_model=ThreadMessagesResponse)
def get_thread_messages(thread_id: int, request: Request):
    _guard_api_key(request.headers)
    t = _threads.get(thread_id)
    if not t:
        raise HTTPException(status_code=404, detail="Thread not found")
    return {"messages": t["messages"]}

@app.get("/api/health")
def health():
    return {"status": "ok"}




# ---------------- Chat Flow ----------------
FAQ_PROMPT = ChatPromptTemplate.from_template(
    (
        "You are a helpful assistant. A user asked a question.\n"
        "You are given the most relevant FAQ pair below. Use the ANSWER verbatim if it fully addresses the query.\n"
        "If slight rewording improves clarity, you may do so but do not introduce new facts.\n\n"
        "USER QUESTION:\n{question}\n\n"
        "MATCHED FAQ:\nQ: {faq_q}\nA: {faq_a}\n\n"
        "Final answer:"
    )
)

WEB_SUMMARY_PROMPT = ChatPromptTemplate.from_template(
    (
        "Summarize the key facts to answer the user's question using the web snippets below. "
        "Answer concisely and cite with [#] indexes in-line, mapping to the snippets order.\n\n"
        "QUESTION: {question}\n\n"
        "SNIPPETS:\n{snippets}\n\n"
        "Answer:"
    )
)

def web_search_answer(query: str) -> Optional[str]:
    """Return an LLM-composed answer from DuckDuckGo snippets, or None."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=WEB_SNIPPETS))
        if not results:
            return None
        # Build snippets block
        lines = []
        for i, r in enumerate(results, start=1):
            title = r.get("title", "")
            body = r.get("body", "")
            href = r.get("href", "")
            lines.append(f"[{i}] {title} — {body} ({href})")
        snippets = "\n".join(lines)

        llm = Ollama(model=MODEL_NAME)
        prompt = WEB_SUMMARY_PROMPT.format_messages(question=query, snippets=snippets)
        return StrOutputParser().invoke(llm.invoke(prompt))
    except Exception as e:
        print(f"[WEB SEARCH ERROR] {e}")
        return None

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
        # Similarity search with scores (cosine). Higher score = more similar.
        similar = vs.similarity_search_with_score(req.message, k=3)
    except Exception as e:
        similar = []
        print(f"[FAQ RETRIEVAL ERROR] {e}")

    if similar:
        best_doc, score = similar[0]
        # `score` is cosine similarity in [0..1] when using FAISS + cosine
        if score >= FAQ_CONFIDENCE:
            faq_q = best_doc.page_content
            faq_a = best_doc.metadata.get("answer", "")
            # Optionally let LLM rephrase; or return faq_a directly
            try:
                llm = Ollama(model=MODEL_NAME)
                prompt = FAQ_PROMPT.format_messages(question=req.message, faq_q=faq_q, faq_a=faq_a)
                output = StrOutputParser().invoke(llm.invoke(prompt))
            except Exception:
                output = faq_a  # safe fallback

            with _lock:
                _threads[tid]["messages"].append({"type": "bot", "content": output})
                messages = [Message(**m) for m in _threads[tid]["messages"]]
            elapsed_ms = int((time.time() - start) * 1000)
            return ChatResponse(thread_id=tid, response=output, elapsed_ms=elapsed_ms, messages=messages)

    # ------- 2) Low confidence → Web or Contact -------
    # if ENABLE_WEB_SEARCH:
        # web_ans = web_search_answer(req.message)
        # if web_ans:
        #     with _lock:
        #         _threads[tid]["messages"].append({"type": "bot", "content": web_ans})
        #         messages = [Message(**m) for m in _threads[tid]["messages"]]
        #     elapsed_ms = int((time.time() - start) * 1000)
        #     return ChatResponse(thread_id=tid, response=web_ans, elapsed_ms=elapsed_ms, messages=messages)

    # ------- 3) Contact fallback -------
    output = CONTACT_MESSAGE
    with _lock:
        _threads[tid]["messages"].append({"type": "bot", "content": output})
        messages = [Message(**m) for m in _threads[tid]["messages"]]
    elapsed_ms = int((time.time() - start) * 1000)
    return ChatResponse(thread_id=tid, response=output, elapsed_ms=elapsed_ms, messages=messages)
