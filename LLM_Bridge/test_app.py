from fastapi import FastAPI

app = FastAPI(title="Test App")

@app.get("/api/test")
def test():
    return {"message": "test successful"}

@app.get("/api/health")  
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
