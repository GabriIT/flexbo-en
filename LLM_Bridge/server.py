#!/usr/bin/env python3
import os
import time
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
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
    print(f"✓ FAQ: {len(faq_store.qa_pairs)} pairs")
except Exception as e:
    print(f"✗ FAQ: {e}")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=ALLOW_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health():
    cnt = len(faq_store.qa_pairs) if faq_store else 0
    return {"status": "ok", "faq_count": cnt}

@app.post("/api/chat")
def chat(req: dict, request: Request):
    if REQUIRE_API_KEY and request.headers.get("x-api-key") != API_KEY:
        raise HTTPException(status_code=401)
    
    start = time.time()
    msg = req.get("message", "")
    tid = req.get("thread_id") or 1
    
    response = "Please contact support"
    
    if faq_store and msg:
        try:
            results = faq_store.similarity_search_with_score(msg, k=1)
            if results:
                qa, score = results[0]
                if score >= KB_CONFIDENCE:
                    response = qa.get("answer", "")
        except Exception as e:
            print(f"Error: {e}")
    
    return {
        "thread_id": tid,
        "response": response,
        "elapsed_ms": int((time.time() - start) * 1000),
        "messages": [{"type": "user", "content": msg}, {"type": "bot", "content": response}]
    }
