#!/usr/bin/env python3
"""
Flexbo FAQ Backend - FastAPI Server
Uses simple keyword-based FAQ matching (no Ollama or embeddings required)
"""
import os
import time
import threading
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# --- Config ---
API_KEY = os.getenv("API_KEY", "secret")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")
KB_CONFIDENCE = float(os.getenv("KB_CONFIDENCE", "0.25"))

CONTACT_MESSAGE = os.getenv(
    "CONTACT_MESSAGE",
    "This seems outside my current knowledge base. Please reach out via the Contact page (/contact) and we'll get back to you quickly."
)

# --- Load FAQ Store ---
print("[STARTUP] Loading FAQ store...")
try:
    from .simple_faq_loader import get_faq_store
    faq_store = get_faq_store()
    print(f"✓ FAQ store loaded with {len(faq_store.documents)} Q&A pairs")
except Exception as e:
    print(f"✗ FAQ loading failed: {e}")
    faq_store = None

# --- FastAPI App ---
app = FastAPI(title="Flexbo FAQ Backend", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helpers ---
def _guard_api_key(headers) -> None:
    if not REQUIRE_API_KEY:
        return
    if headers.get("x-api-key") != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

def search_faq(query: str, k: int = 3) -> List[Dict]:
    """Search FAQ and return matching results."""
    if not faq_store or not faq_store.documents:
        return []
    
    try:
        results = faq_store.similarity_search_with_score(query, k=k)
        output = []
        for doc, score in results:
            answer = doc.metadata.get("answer", "")
            output.append({
                "question": doc.page_content,
                "answer": answer,
                "score": float(score)
            })
        return output
    except Exception as e:
        print(f"[FAQ SEARCH ERROR] {e}")
        return []

# --- Models ---
class Message(BaseModel):
    type: str  # 'user' | 'bot'
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

# --- Thread Management ---
_threads: Dict[int, Dict] = {}
_next_id = 1
_lock = threading.Lock()

# --- Endpoints ---
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "faq_count": len(faq_store.documents) if faq_store else 0,
    }

@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest, request: Request):
    """Chat endpoint using FAQ search."""
    _guard_api_key(request.headers)
    start = time.time()

    # Ensure thread exists
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

    # 1) Search FAQ
    sources: List[Source] = []
    response_text: Optional[str] = None

    try:
        results = search_faq(req.message, k=5)
        
        if results and results[0]["score"] >= KB_CONFIDENCE:
            # Use the best matching FAQ answer
            best = results[0]
            response_text = best["answer"]
            
            # Limit answer length
            if len(response_text) > 800:
                response_text = response_text[:800] + "..."
            
            # Add sources
            for i, result in enumerate(results[:3], start=1):
                sources.append(Source(
                    index=i,
                    title="FAQ",
                    url=None,
                    score=result["score"],
                    source_type="faq"
                ))
            
            print(f"[FAQ MATCH] Score {best['score']:.3f}: {best['question'][:50]}...")
        else:
            if results:
                print(f"[FAQ NO MATCH] Score {results[0]['score']:.3f} below threshold {KB_CONFIDENCE}")
            else:
                print(f"[FAQ NO MATCH] No results found")
    
    except Exception as e:
        print(f"[ERROR] Chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # 2) Fallback
    if not response_text:
        response_text = CONTACT_MESSAGE

    # 3) Add to thread and respond
    with _lock:
        _threads[tid]["messages"].append({"type": "bot", "content": response_text})
        messages = [Message(**m) for m in _threads[tid]["messages"]]

    elapsed_ms = int((time.time() - start) * 1000)
    return ChatResponse(
        thread_id=tid,
        response=response_text,
        elapsed_ms=elapsed_ms,
        messages=messages,
        sources=sources if sources else None
    )

@app.get("/api/debug/sim")
def debug_sim(q: str = Query(..., min_length=1)):
    """Debug FAQ similarity search."""
    results = search_faq(q, k=5)
    return {
        "query": q,
        "results": results
    }

@app.post("/api/debug/echo")
def echo(payload: dict):
    """Echo endpoint for debugging."""
    return payload
