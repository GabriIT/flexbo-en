# LLM_Bridge/server.py
import os
import time
import threading
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from sqlalchemy import create_engine, text as sql_text

from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from sqlalchemy import create_engine, text as sql_text, bindparam, event
from pgvector.sqlalchemy import Vector
from pgvector.psycopg import register_vector  # keep if you want the adapter too


#  auto-load .env if present
try:
    from dotenv import load_dotenv
    # Load .env file explicitly
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
    DB_URL = os.getenv("RAG_DB_URL")
    print (f"Using DB_URL: {DB_URL}")
    if not DB_URL:
        raise RuntimeError("❌ RAG_DB_URL not found. Check your .env file!")
    
except Exception:
    pass

# ---------------- Config ----------------
MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
DB_URL = os.getenv("RAG_DB_URL") #, "postgresql+psycopg://user:pass@localhost:5432/flexbo")
if not DB_URL:
    raise RuntimeError("RAG_DB_URL not set")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")  # Ollama server URL
if not OLLAMA_HOST:
    raise RuntimeError("OLLAMA_HOST not set")

os.environ["OLLAMA_HOST"] = OLLAMA_HOST  # LangChain reads this
print(f"Using DB_URL: {DB_URL}")
print(f"Using OLLAMA_HOST: {OLLAMA_HOST}")


API_KEY = os.getenv("API_KEY", "secret")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")

KB_TOPK = int(os.getenv("KB_TOPK", "5"))
KB_CONFIDENCE = float(os.getenv("KB_CONFIDENCE", "0.65"))

CONTACT_MESSAGE = os.getenv(
    "CONTACT_MESSAGE",
    "This seems outside my current knowledge base. Please reach out via the Contact page (/contact) and we’ll get back to you quickly."
)

# ---------------- Infra ----------------
engine = create_engine(DB_URL, future=True)

@event.listens_for(engine, "connect")
def register_vector_on_connect(dbapi_connection, connection_record):
   try:
        register_vector(dbapi_connection)  # won't hurt even if we type the bind
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
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are FLEXBO Assistant. Be concise, factual, and safe."),
            ("user", "Prompt: {query}")
        ]
    )
    llm = Ollama(model=MODEL_NAME)
    return prompt | llm | StrOutputParser()

base_chain = build_llm()

CITED_ANSWER_PROMPT = ChatPromptTemplate.from_template(
    (
        "Answer the user's question using ONLY the provided context snippets.\n"
        "Be concise and add in-line citation markers like [1], [2] that map to the snippets order.\n"
        "If context is insufficient, say so and suggest visiting the contact page.\n\n"
        "QUESTION:\n{question}\n\n"
        "CONTEXT SNIPPETS:\n{snippets}\n\n"
        "Final answer with citations:"
    )
)

# ---------------- Search (pgvector) ----------------
EMBED_DIM = int(os.getenv("EMBED_DIM", "768"))  # nomic-embed-text = 768

def search_kb(query: str, k: int):
    vec = emb.embed_query(query)  # Python list[float], length 768
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

# ---------------- Simple in-memory threads ----------------
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

    # 1) RAG retrieval from pgvector
    sources: List[Source] = []
    output = None
    try:
        rows = search_kb(req.message, k=KB_TOPK)
    except Exception as e:
        rows = []
        print(f"[KB SEARCH ERROR] {e}")

    if rows:
        top_score = float(rows[0].get("score") or 0.0)
        if top_score >= KB_CONFIDENCE:
            # Build cited answer
            try:
                snippets = rows_to_snippets(rows)
                llm = Ollama(model=MODEL_NAME)
                prompt = CITED_ANSWER_PROMPT.format_messages(question=req.message, snippets=snippets)
                output = StrOutputParser().invoke(llm.invoke(prompt))
            except Exception as e:
                print(f"[KB LLM ERROR] {e}")
                # fallback to showing top chunk
                output = rows[0].get("content")[:600] + "..."

            # Collect typed sources (send top 3)
            for i, r in enumerate(rows[:3], start=1):
                sources.append(Source(
                    index=i,
                    title=(r.get("title") or r.get("url") or "Untitled"),
                    url=r.get("url"),
                    score=float(r.get("score") or 0.0),
                    source_type=r.get("source_type"),
                ))

    # 2) If no good RAG answer, fall back to generic/contact
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
