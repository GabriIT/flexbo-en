# threads_service.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
import threading

app = FastAPI()

# In‐memory storage of threads
threads: Dict[int, Dict] = {}
next_id = 1
lock = threading.Lock()

# --- Models ---
class CreateThreadRequest(BaseModel):
    content: str

class Message(BaseModel):
    type: str   # 'user' or 'bot'
    content: str

class ThreadMessagesResponse(BaseModel):
    messages: List[Message]

class AnswerRequest(BaseModel):
    content: str

# --- CORS (so your React UI can POST) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# 1) UI posts here to start a new thread
@app.post("/api/thread", response_model=Dict[str, int])
def create_thread(req: CreateThreadRequest):
    global next_id
    with lock:
        thread_id = next_id
        next_id += 1
        # initialize with the user’s message
        threads[thread_id] = {
            "messages": [{"type": "user", "content": req.content}],
            "answered": False
        }
    return {"id": thread_id}

# 2) bridge.py polls this for all threads yet unanswered
@app.get("/api/thread/pending", response_model=List[Dict[str, int]])
def get_pending_threads():
    pending = []
    with lock:
        for tid, data in threads.items():
            if not data["answered"]:
                pending.append({"id": tid})
    return pending

# 3) bridge.py fetches the conversation so far
@app.get("/api/thread/{thread_id}/prompt/messages", response_model=ThreadMessagesResponse)
def get_thread_messages(thread_id: int):
    thread = threads.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    return {"messages": thread["messages"]}

# 4) bridge.py posts the LLM’s reply here
@app.post("/api/thread/{thread_id}/prompt/answer")
def post_answer(thread_id: int, req: AnswerRequest):
    with lock:
        thread = threads.get(thread_id)
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        thread["messages"].append({"type": "bot", "content": req.content})
        thread["answered"] = True
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "threads_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

# if without server lines, I can run the script with
# `uvicorn threads_service:app --reload --host 0.0.0.0 --port 8000`
