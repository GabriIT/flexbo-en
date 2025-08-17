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
# First time you run with the CSV, the service will build and persist a FAISS
# index at FAQ_INDEX_DIR.
You can hot-reload after replacing the CSV:
curl -X POST "http://localhost:8000/api/knowledge/reload"
# or specify a new csv:
curl -X POST "http://localhost:8000/api/knowledge/reload?csv_path=/path/new.csv"

# To run the server, use:
# must have in the same folder a empty file __init__.py
python -m uvicorn LLM_Bridge.server:app --host 0.0.0.0 --port 8000 --reload

ollama serve &
ollama pull nomic-embed-text


# Health
GET http://localhost:8000/api/health

# Load knowledge (optional if index not present):
POST http://localhost:8000/api/knowledge/reload

# The site as deloyed today 16.Aug.2025 is integrated with FAQ csv file for reliable answers

# Express Server not integrated yet

# Run it with RAG

### export RAG_DB_URL="postgresql+psycopg://flexbo:yourStrongPassword@localhost:5432/flexbo"

export RAG_DB_URL="postgresql+psycopg://flexbo:flexbo@localhost:5432/flexbo"
export EMBED_MODEL=nomic-embed-text
export FAQ_CSV_PATH="/LLM_Bridge/faq.csv"
python LLM_Bridge/ingest_csv_to_kb.py

# If you also want to ingest the sitemap pages (highly recommended for linking):
export SITEMAP_URL="https://flexbo-en.athenalabo.com/sitemap.xml"
python LLM_Bridge/ingest_sitemap.py


# 6) One-time table creation (if you didn’t run the ingester yet)

If you haven’t run ingest_sitemap.py (which creates the table), you can create the table once:


```
dokku postgres:connect flexbo-db     # or psql locally
-- then:
CREATE TABLE IF NOT EXISTS kb_chunks (
  id BIGSERIAL PRIMARY KEY,
  source_type TEXT NOT NULL,
  url TEXT,
  title TEXT,
  section_anchor TEXT,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kb_embed_cosine ON kb_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_kb_url ON kb_chunks (url);
CREATE INDEX IF NOT EXISTS idx_kb_source_type ON kb_chunks (source_type);
\q

```

