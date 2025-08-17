# LLM_Bridge/server.py
import os
import time
import threading
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from dotenv import load_dotenv

from sqlalchemy import create_engine, text as sql_text, bindparam, event
from pgvector.sqlalchemy import Vector
from pgvector.psycopg import register_vector

from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

base_chain = build_llm()

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

# ---------------- Models ----------------
class Message(BaseModel):
    type: str   # 'user' | 'bot'
    content: str

class Source(BaseModel):
    index: int
    title: str
    url: Optional[str] = None
    score: float
    source_type: Optional[str] = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    thread_id: Optional[int] = None

class ChatResponse(BaseModel):
    thread_id: int
    response: str
    elapsed_ms: int
    messages: List[Message]
    sources: Optional[List[Source]] = None

# ---------------- In-memory threads ----------------
_threads: Dict[int, Dict] = {}
_next_id = 1
_lock = threading.Lock()

# ---------------- Routes ----------------
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "embed_model": EMBED_MODEL,
        "db": DB_URL.split("@")[-1],  # hide credentials
        "kb_topk": KB_TOPK,
        "kb_confidence": KB_CONFIDENCE,
        "embed_dim": EMBED_DIM,
    }

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

    # 1) RAG retrieval
    sources: List[Source] = []
    output: Optional[str] = None

    try:
        rows = search_kb(req.message, k=KB_TOPK)
    except Exception as e:
        rows = []
        print(f"[KB SEARCH ERROR] {e}")

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

    with _lock:
        _threads[tid]["messages"].append({"type": "bot", "content": output})
        msgs = [Message(**m) for m in _threads[tid]["messages"]]

    elapsed_ms = int((time.time() - start) * 1000)
    return ChatResponse(
        thread_id=tid,
        response=output,
        elapsed_ms=elapsed_ms,
        messages=msgs,
        sources=sources if sources else None
    )

@app.post("/api/thread", response_model=Dict[str, int])
def create_thread(request: Request):
    _guard_api_key(request.headers)
    global _next_id
    with _lock:
        tid = _next_id
        _next_id += 1
        _threads[tid] = {"messages": []}
    return {"id": tid}

@app.get("/api/thread/{thread_id}", response_model=Dict[str, List[Message]])
def get_thread(thread_id: int, request: Request):
    _guard_api_key(request.headers)
    t = _threads.get(thread_id)
    if not t:
        raise HTTPException(status_code=404, detail="Thread not found")
    return {"messages": [Message(**m) for m in t["messages"]]}
