# LLM_Bridge/server.py
import os
import time
import threading
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# ---------------- Config ----------------
MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
API_KEY = os.getenv("API_KEY", "secret")                # simple header check (optional)
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")
REQUIRE_API_KEY = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"

# ---------------- App ----------------
app = FastAPI(title="Flexbo LLM Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- LLM Chain ----------------
def build_chain():
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are FLEXBO Assistant. Be concise, helpful, and safe."),
            ("user", "Prompt: {query}")
        ]
    )
    llm = Ollama(model=MODEL_NAME)   # Uses OLLAMA_HOST if set
    return prompt | llm | StrOutputParser()

chain = build_chain()

# ---------------- In-memory threads (optional) ----------------
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

# ---------------- Health ----------------
@app.get("/api/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}

# ---------------- Threads (optional) ----------------
@app.post("/api/thread", response_model=Dict[str, int])
def create_thread(req: CreateThreadRequest):
    with _lock:
        global _next_id
        tid = _next_id
        _next_id += 1
        _threads[tid] = {"messages": [Message(type="user", content=req.content).model_dump()]}
    return {"id": tid}

@app.get("/api/thread/{thread_id}", response_model=ThreadMessagesResponse)
def get_thread_messages(thread_id: int):
    t = _threads.get(thread_id)
    if not t:
        raise HTTPException(status_code=404, detail="Thread not found")
    return {"messages": t["messages"]}

# ---------------- Synchronous chat (the only thing UI needs now) ----------------
@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # Optional header guard
    # _guard_api_key(request.headers)  # uncomment if you wire in Request

    start = time.time()

    # Ensure thread
    with _lock:
        tid = req.thread_id
        if tid is None:
            # create new thread
            global _next_id
            tid = _next_id
            _next_id += 1
            _threads[tid] = {"messages": []}
        if tid not in _threads:
            raise HTTPException(status_code=404, detail="Thread not found")

        _threads[tid]["messages"].append({"type": "user", "content": req.message})

    # Call LLM
    try:
        output = chain.invoke({"query": req.message})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {e}")

    with _lock:
        _threads[tid]["messages"].append({"type": "bot", "content": output})
        messages = [Message(**m) for m in _threads[tid]["messages"]]

    elapsed_ms = int((time.time() - start) * 1000)
    return ChatResponse(thread_id=tid, response=output, elapsed_ms=elapsed_ms, messages=messages)

# ---------------- Run (local dev) ----------------
# uvicorn server:app --host 0.0.0.0 --port 8000 --reload
