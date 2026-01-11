# Flexbo FAQ backend (CSV only)
Uses `LLM_Bridge/server.py` with simple CSV-based matching (no FAISS/vector store).

## Setup
pip install langchain-community duckduckgo-search pandas python-dotenv
pip install uvicorn fastapi

## Run
export FAQ_CSV_PATH="/LLM_Bridge/faq.csv"
python -m uvicorn LLM_Bridge.server:app --host 0.0.0.0 --port 8000 --reload

## Health
GET http://localhost:8000/api/health

# The site as deployed is integrated with FAQ CSV for reliable answers
