#!/usr/bin/env python3
"""
Flexbo FAQ Backend - Minimal implementation
"""
import os
import time
import threading
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

API_KEY = os.getenv("API_KEY", "secret")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")
KB_CONFIDENCE = float(os.getenv("KB_CONFIDENCE", "0.25"))
CONTACT_MSG = os.getenv("CONTACT_MESSAGE", "Please reach out via /contact")

# Load FAQ
faq_store = None
try:
    from .simple_faq_loader import get_faq_store
    faq_store = get_faq_store()
    print(f"✓ FAQ loaded: {len(faq_store.qa_pairs)} pairs")
except Exception as e:
    print(f"✗ FAQ error: {e}")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=ALLOW_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class Message(BaseModel):
    type: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    thread_id: Optional[int] = None

class ChatResponse(BaseModel):
    thread_id: int
    response: str
    elapsed_ms: int
    messages: List[Message]

_threads = {}
_next_id = 1
_lock = threading.Lock()

@app.get("/api/health")
def health():
    count = len(faq_store.qa_pairs) if faq_store else 0
    return {"status": "ok", "faq_count": count}

@app.post("/api/chat")
def chat(req: ChatRequest, request: Request):
    if REQUIRE_API_KEY and request.headers.get("x-api-key") != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    start = time.time()
    
    with _lock:
        tid = req.thread_id or _next_id
        if tid == _next_id:
            _next_id += 1
        if tid not in _threads:
            _threads[tid] = {"messages": []}
        _threads[tid]["messages"].append({"type": "user", "content": req.message})
    
    response_text = CONTACT_MSG
    
    if faq_store:
        try:
            results = faq_store.similarity_search_with_score(req.message, k=3)
            if results:
                best_qa, best_score = results[0]
                if best_score >= KB_CONFIDENCE:
                    response_text = best_qa.get("answer", "")[:800]
        except Exception as e:
            print(f"Search error: {e}")
    
    with _lock:
        _threads[tid]["messages"].append({"type": "bot", "content": response_text})
        msgs = [{"type": m["type"], "content": m["content"]} for m in _threads[tid]["messages"]]
    
    return {
        "thread_id": tid,
        "response": response_text,
        "elapsed_ms": int((time.time() - start) * 1000),
        "messages": msgs
    }
