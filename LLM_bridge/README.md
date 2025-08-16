# Local tested successfully ollama serve with Chatbot
using only file server.py on env llm

# Next Step
### Additing csv QA for allowing corrrect specific answers 

# in your backend env
pip install langchain-community faiss-cpu duckduckgo-search pandas python-dotenv
# if you don’t already have it
pip install uvicorn fastapi

# Make sure Ollama has a embedding model
ollama pull nomic-embed-text

# TEST local
curl -X POST "http://localhost:8000/api/knowledge/reload"
# or specify a new csv:
curl -X POST "http://localhost:8000/api/knowledge/reload?csv_path=/path/new.csv"

# To run the server, use:

# uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# Health
GET http://localhost:8000/api/health

# Load knowledge (optional if index not present):
POST http://localhost:8000/api/knowledge/reload

# The site as deloyed today 16.Aug.2025 is integrated with FAQ csv file for reliable answers

# Express Server not integrated yet
