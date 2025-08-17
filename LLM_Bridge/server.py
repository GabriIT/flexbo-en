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

<<<<<<< HEAD
=======
from dotenv import load_dotenv

from sqlalchemy import create_engine, text as sql_text, bindparam, event
from pgvector.sqlalchemy import Vector
from pgvector.psycopg import register_vector

>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)
from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.vectorstores import FAISS

<<<<<<< HEAD
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
=======
# --- utils ---
from .polish_answer import polish_answer   # ensure LLM_Bridge/polish_answer.py exists
# and ensure LLM_Bridge/__init__.py exists (can be empty)

# ---------------- Env & Config ----------------
# Load .env that sits next to this file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

DB_URL = os.getenv("RAG_DB_URL")
if not DB_URL:
    raise RuntimeError("RAG_DB_URL not set (put it in LLM_Bridge/.env or export it)")

MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
os.environ["OLLAMA_HOST"] = OLLAMA_HOST  # let LangChain pick it up

API_KEY = os.getenv("API_KEY", "secret")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")

KB_TOPK = int(os.getenv("KB_TOPK", "5"))
KB_CONFIDENCE = float(os.getenv("KB_CONFIDENCE", "0.65"))
EMBED_DIM = int(os.getenv("EMBED_DIM", "768"))  # nomic-embed-text = 768

CONTACT_MESSAGE = os.getenv(
    "CONTACT_MESSAGE",
    "This seems outside my current knowledge base. Please reach out via the Contact page (/contact) and we’ll get back to you quickly."
)

print(f"Using DB_URL: {DB_URL}")
print(f"Using OLLAMA_HOST: {OLLAMA_HOST}")

# ---------------- Infra ----------------
engine = create_engine(DB_URL, future=True)

@event.listens_for(engine, "connect")
def register_vector_on_connect(dbapi_connection, connection_record):
    try:
        register_vector(dbapi_connection)  # registers pgvector for psycopg3
    except Exception:
        pass

emb = OllamaEmbeddings(model=EMBED_MODEL)

def _guard_api_key(headers) -> None:
    if not REQUIRE_API_KEY:
        return
    if headers.get("x-api-key") != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

# ---------------- App ----------------
app = FastAPI(title="Flexbo RAG Backend", version="3.0.0")
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
# --- Helpers ---
def _ollama_llm() -> Ollama:
    # Always pass base_url to avoid implicit localhost
    return Ollama(model=MODEL_NAME, base_url=OLLAMA_URL)
=======
# ---------------- LLM ----------------
def build_llm():
    """
    Generic chat chain (for non-RAG use). Brand voice: crisp, client-oriented, no meta-commentary.
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system",
             "You are FLEXBO Assistant. Speak like a helpful product specialist. "
             "Be concise, confident, and client-oriented. Never mention 'context', 'snippets', "
             "or your internal reasoning. Avoid hedging or apologies unless necessary."),
            ("user", "Prompt: {query}")
        ]
    )
    llm = Ollama(model=MODEL_NAME, temperature=0.2)
    return prompt | llm | StrOutputParser()
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)

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
    # Treat the score as cosine *distance*
    return max(0.0, min(1.0, 1.0 - s))
    
    
def _clean_answer(text: str) -> str:
    """Trim quotes/markdown and drop meta-headings if present."""
    t = (text or "").strip()

<<<<<<< HEAD
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
=======
# Few-shot, client-oriented, no meta commentary; inline [#] citations
CITED_ANSWER_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You are FLEXBO Assistant. Write a client-oriented answer using ONLY the context snippets.\n"
     "STYLE RULES:\n"
     "• Be crisp and confident. No meta-commentary (never say 'based on snippets', 'context', 'I can only conclude').\n"
     "• No apologies unless necessary. Avoid filler.\n"
     "• Prefer short paragraphs and clear bullets.\n"
     "• Include inline citations like [1], [2] at the ends of the sentences they support.\n"
     "• If information is missing, say what’s available succinctly and suggest next steps (e.g., request details or visit Contact page), without meta-talk.\n"
     "• Do not invent facts. Only state what’s supported by the snippets.\n\n"
     "FORMAT:\n"
     "1) A one-sentence summary answering the user.\n"
     "2) 3–7 bullet points with specifics (materials, sizes, options, certifications, lead times, etc.).\n"
     "3) Optional next step (e.g., 'Want specs or a quote? Tell me your volume/use-case' or 'You can also reach us via the Contact page').\n"
     "4) Leave the inline [#] citations within the text where relevant (no separate References section)."),
    # Example 1 (few-shot)
    ("user",
     "QUESTION:\nWhat are the key features of your aseptic bags?\n\n"
     "CONTEXT SNIPPETS:\n"
     "[1] Aseptic bags use multi-layer film with high barrier options ... (https://flexbo.../products)\n"
     "[2] Sizes from 1L to 1500L ... (https://flexbo.../products)\n"
     "[3] Quality control includes AI-assisted inspection ... (https://flexbo.../quality)"),
    ("assistant",
     "Our aseptic bags are engineered for safe, long-shelf-life filling and transport.[1]\n\n"
     "• Multi-layer films with standard/high/very-high barrier options for oxygen and light.[1]\n"
     "• Capacities from 1 L to 1500 L; fit common spouts and IBC systems.[2]\n"
     "• AI-assisted, human-verified quality control for consistent seals and integrity.[3]\n\n"
     "Need sizing help or a quote? Tell me your product and volume, or reach us via the Contact page."),
    # Actual task
    ("user",
     "QUESTION:\n{question}\n\nCONTEXT SNIPPETS (ordered):\n{snippets}\n"),
])

# ---------------- Search (pgvector) ----------------
def search_kb(query: str, k: int):
    vec = emb.embed_query(query)  # list[float], length EMBED_DIM
    q = sql_text("""
        SELECT id, source_type, url, title, section_anchor, content,
               1 - (embedding <=> :vec) AS score
        FROM kb_chunks
        ORDER BY embedding <=> :vec
        LIMIT :k
    """).bindparams(
        bindparam("vec", value=vec, type_=Vector(EMBED_DIM)),
        bindparam("k", value=k)
    )
    with engine.begin() as conn:
        rows = conn.execute(q).mappings().all()
    return rows

def rows_to_snippets(rows):
    blocks = []
    for i, r in enumerate(rows, start=1):
        title = r.get("title") or (r.get("url") or "Untitled")
        url = r.get("url")
        body = r.get("content", "")
        snippet = body if len(body) <= 700 else body[:700] + "..."
        blocks.append(f"[{i}] {title} — {snippet} ({url})")
    return "\n\n".join(blocks)
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)

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

<<<<<<< HEAD
def _guard_api_key(headers) -> None:
    if not REQUIRE_API_KEY:
        return
    if headers.get("x-api-key") != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
=======
# ---------------- In-memory threads ----------------
_threads: Dict[int, Dict] = {}
_next_id = 1
_lock = threading.Lock()
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)

# --- Health/Admin ---
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "embed_model": EMBED_MODEL,
<<<<<<< HEAD
        "ollama_url": OLLAMA_URL,
=======
        "db": DB_URL.split("@")[-1],  # hide credentials
        "kb_topk": KB_TOPK,
        "kb_confidence": KB_CONFIDENCE,
        "embed_dim": EMBED_DIM,
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)
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

<<<<<<< HEAD
    # 1) retrieve similar FAQs
=======
    # 1) RAG retrieval
    sources: List[Source] = []
    output: Optional[str] = None

>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)
    try:
        vs = get_faq_vs()
        pairs: List[Tuple] = vs.similarity_search_with_score(req.message, k=3)
        # sims = [(d, _score_to_similarity(s)) for d, s in pairs]
        sims = []
        for d, raw in pairs:
            sim = _score_to_similarity(raw)
            sims.append((d, sim, raw))   # keep raw for debug
        # sort by similarity descending        
        sims.sort(key=lambda x: x[1], reverse=True)
        print("[FAQ DEBUG]", [(d.page_content[:40], f"{sim:.3f}") for d, sim,raw in sims])
    except Exception as e:
        sims = []
        print(f"[FAQ RETRIEVAL ERROR] {e}")
        traceback.print_exc()  # <-- add this for visibility

<<<<<<< HEAD

    # 2) threshold -> use CSV answer (default) or LLM rewriter (optional)
    if sims:
        best_doc, best_sim, best_raw = sims[0]
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
=======
    if rows:
        top_score = float(rows[0].get("score") or 0.0)
        if top_score >= KB_CONFIDENCE:
            try:
                snippets = rows_to_snippets(rows)
                llm = Ollama(model=MODEL_NAME, temperature=0.2)
                prompt_msgs = CITED_ANSWER_PROMPT.format_messages(question=req.message, snippets=snippets)
                output = StrOutputParser().invoke(llm.invoke(prompt_msgs))
                # polish style (strip meta-talk, collapse blanks)
                output = polish_answer(output)
            except Exception as e:
                print(f"[KB LLM ERROR] {e}")
                output = rows[0].get("content")[:600] + "..."

            # top 3 typed sources
            for i, r in enumerate(rows[:3], start=1):
                sources.append(Source(
                    index=i,
                    title=(r.get("title") or r.get("url") or "Untitled"),
                    url=r.get("url"),
                    score=float(r.get("score") or 0.0),
                    source_type=r.get("source_type"),
                ))

    # 2) Fallback
    if not output:
        output = CONTACT_MESSAGE
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)

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
