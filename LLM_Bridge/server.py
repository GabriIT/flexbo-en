#!/usr/bin/env python3
import os
import time
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

API_KEY = os.getenv("API_KEY", "secret")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")
KB_CONFIDENCE = float(os.getenv("KB_CONFIDENCE", "0.25"))

faq_store = None
try:
    from .simple_faq_loader import get_faq_store
    faq_store = get_faq_store()
    print(f"✓ FAQ: {len(faq_store.qa_pairs)} Q&A pairs loaded")
except Exception as e:
    print(f"✗ FAQ error: {e}")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=ALLOW_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class Message(BaseModel):
    type: str
    content: str

class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[int] = None

@app.get("/api/health")
def health():
    cnt = len(faq_store.qa_pairs) if faq_store else 0
    return {"status": "ok", "faq_count": cnt}

@app.post("/api/chat")
def chat(req: ChatRequest, request: Request):
    print(f"[CHAT] Message: {req.message[:50]}, API key required: {REQUIRE_API_KEY}")
    
    if REQUIRE_API_KEY:
        key = request.headers.get("x-api-key")
        print(f"[CHAT] Checking API key: {key}")
        if key != API_KEY:
            print(f"[CHAT] API key check failed")
            raise HTTPException(status_code=401, detail="Invalid API key")
    
    start = time.time()
    response = "Please contact support"
    
    if faq_store:
        try:
            results = faq_store.similarity_search_with_score(req.message, k=1)
            if results:
                qa, score = results[0]
                if score >= KB_CONFIDENCE:
                    response = qa.get("answer", "")[:800]
                    print(f"[CHAT] FAQ match (score={score:.2f})")
        except Exception as e:
            print(f"[CHAT] Search error: {e}")
    
    return {
        "thread_id": req.thread_id or 1,
        "response": response,
        "elapsed_ms": int((time.time() - start) * 1000),
        "messages": [
            {"type": "user", "content": req.message},
            {"type": "bot", "content": response}
        ]
    }
