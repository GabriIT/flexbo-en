# LLM_Bridge/server.py
import os
import time
import threading
from typing import Dict, List, Optional

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

<<<<<<< HEAD
from duckduckgo_search import DDGS  # optional web search
from langchain_community.vectorstores import FAISS

from knowledge_loader import build_or_load_vectorstore, reload_vectorstore
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
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)

MODEL_NAME = os.getenv("OLLAMA_MODEL", "tinyllama:1.1b-chat-v1-q4_0")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
<<<<<<< HEAD
=======
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
os.environ["OLLAMA_HOST"] = OLLAMA_HOST  # let LangChain pick it up

>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)
API_KEY = os.getenv("API_KEY", "secret")
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"

<<<<<<< HEAD
FAQ_CONFIDENCE = float(os.getenv("FAQ_CONFIDENCE", "0.70"))   # cosine sim, 0..1
ENABLE_WEB_SEARCH = os.getenv("ENABLE_WEB_SEARCH", "false").lower() == "true"
WEB_SNIPPETS = int(os.getenv("WEB_SNIPPETS", "3"))
=======
KB_TOPK = int(os.getenv("KB_TOPK", "5"))
KB_CONFIDENCE = float(os.getenv("KB_CONFIDENCE", "0.65"))
EMBED_DIM = int(os.getenv("EMBED_DIM", "768"))  # nomic-embed-text = 768
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)

CONTACT_MESSAGE = os.getenv(
    "CONTACT_MESSAGE",
    "This seems outside my current knowledge base. Please reach out via the Contact page (/contact) and we’ll get back to you quickly."
)

<<<<<<< HEAD
=======
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

>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)
# ---------------- App ----------------
app = FastAPI(title="Flexbo LLM + FAQ Backend", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
# ---------------- LLM Chain ----------------
def build_llm_chain():
=======
# ---------------- LLM ----------------
def build_llm():
    """
    Generic chat chain (for non-RAG use). Brand voice: crisp, client-oriented, no meta-commentary.
    """
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system",
             "You are FLEXBO Assistant. Speak like a helpful product specialist. "
             "Be concise, confident, and client-oriented. Never mention 'context', 'snippets', "
             "or your internal reasoning. Avoid hedging or apologies unless necessary."),
            ("user", "Prompt: {query}")
        ]
    )
<<<<<<< HEAD
    llm = Ollama(model=MODEL_NAME)   # Uses OLLAMA_HOST if set
=======
    llm = Ollama(model=MODEL_NAME, temperature=0.2)
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)
    return prompt | llm | StrOutputParser()

chain = build_llm_chain()

<<<<<<< HEAD
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

# ---------------- Models ----------------
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)
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

# ---------------- Health & Admin ----------------
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "embed_model": EMBED_MODEL,
<<<<<<< HEAD
        "web_search": ENABLE_WEB_SEARCH,
=======
        "db": DB_URL.split("@")[-1],  # hide credentials
        "kb_topk": KB_TOPK,
        "kb_confidence": KB_CONFIDENCE,
        "embed_dim": EMBED_DIM,
>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)
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

<<<<<<< HEAD
    # ------- 1) Try FAQ retrieval -------
=======
    # 1) RAG retrieval
    sources: List[Source] = []
    output: Optional[str] = None

>>>>>>> ab5be12 (added polish answer and improved client-oriented prompt)
    try:
        vs = get_faq_vs()
        # Similarity search with scores (cosine). Higher score = more similar.
        similar = vs.similarity_search_with_score(req.message, k=3)
    except Exception as e:
        similar = []
        print(f"[FAQ RETRIEVAL ERROR] {e}")

<<<<<<< HEAD
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
    if ENABLE_WEB_SEARCH:
        web_ans = web_search_answer(req.message)
        if web_ans:
            with _lock:
                _threads[tid]["messages"].append({"type": "bot", "content": web_ans})
                messages = [Message(**m) for m in _threads[tid]["messages"]]
            elapsed_ms = int((time.time() - start) * 1000)
            return ChatResponse(thread_id=tid, response=web_ans, elapsed_ms=elapsed_ms, messages=messages)
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

    # ------- 3) Contact fallback -------
    output = CONTACT_MESSAGE
    with _lock:
        _threads[tid]["messages"].append({"type": "bot", "content": output})
        messages = [Message(**m) for m in _threads[tid]["messages"]]
    elapsed_ms = int((time.time() - start) * 1000)
    return ChatResponse(thread_id=tid, response=output, elapsed_ms=elapsed_ms, messages=messages)
