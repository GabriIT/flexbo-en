# LLM_Bridge/ingest_csv_to_kb.py
import os
import re
import sys
import pandas as pd
from typing import Dict, List

from sqlalchemy import create_engine, text, event
from sqlalchemy.engine import Engine


# 1) auto-load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# 2) pgvector adapter for psycopg
try:
    from pgvector.psycopg import register_vector  # pip install pgvector
except Exception as e:
    print("ERROR: Python package 'pgvector' not installed. Run: pip install pgvector")
    raise

from langchain_community.embeddings import OllamaEmbeddings

# --- Config ---
DB_URL = os.getenv("RAG_DB_URL")  # must be set in environment or .env
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
CSV_PATH = os.getenv("FAQ_CSV_PATH", os.path.join(os.path.dirname(__file__), "faq.csv"))

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "120"))

if not DB_URL:
    print("ERROR: RAG_DB_URL is not set. Example:")
    print("export RAG_DB_URL='postgresql+psycopg://flexbo:yourStrongPassword@localhost:5432/flexbo'")
    sys.exit(1)

engine: Engine = create_engine(DB_URL, future=True)

# Register pgvector adapter
@event.listens_for(engine, "connect")
def register_vector_on_connect(dbapi_connection, connection_record):
    try:
        register_vector(dbapi_connection)   # dbapi_connection is a real psycopg3 connection
    except Exception:
        pass

emb = OllamaEmbeddings(model=EMBED_MODEL)

def ensure_table():
    with engine.begin() as conn:
        conn.execute(text("""
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
        """))




def chunk_text(text: str, size=CHUNK_SIZE, overlap=CHUNK_OVERLAP) -> List[str]:
    text = re.sub(r"\s+", " ", text).strip()
    out, i = [], 0
    step = max(1, size - overlap)
    while i < len(text):
        out.append(text[i:i+size])
        i += step
    return out


def upsert_chunk(row: Dict):
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO kb_chunks (source_type, url, title, section_anchor, content, embedding, content_hash)
            VALUES (:source_type, :url, :title, :section_anchor, :content, :embedding, md5(:content))
            ON CONFLICT (source_type, COALESCE(url,''), content_hash) DO NOTHING
        """), row)

def ingest_csv(csv_path: str) -> int:
    if not os.path.isfile(csv_path):
        raise FileNotFoundError(f"CSV not found at {csv_path}")

    df = pd.read_csv(csv_path)
    # Normalize headers to lowercase and strip spaces
    header_map = {c.lower().strip(): c for c in df.columns}

    q_key = header_map.get("question")
    a_key = header_map.get("answer")
    if not q_key or not a_key:
        raise ValueError(
            f"CSV must contain columns named 'Question' and 'Answer'. "
            f"Found: {list(df.columns)}"
        )

    inserted = 0
    for _, row in df.iterrows():
        q = str(row[q_key]).strip()
        a = str(row[a_key]).strip()
        if not q or not a:
            continue

        text_block = f"Q: {q}\nA: {a}"
        for chunk in chunk_text(text_block):
            vec = emb.embed_query(chunk)  # requires `ollama serve` and the embedding model pulled
            upsert_chunk({
                "source_type": "csv",
                "url": None,               # no URL for CSV; can map to a doc later if you want
                "title": "FAQ CSV",
                "section_anchor": None,
                "content": chunk,
                "embedding": vec,
            })
            inserted += 1

    return inserted

if __name__ == "__main__":
    try:
        ensure_table()
        print(f"Ingesting CSV: {CSV_PATH}")
        count = ingest_csv(CSV_PATH)
        print(f"CSV ingestion complete. {count} chunks inserted.")
    except Exception as e:
        print(f"[INGEST CSV ERROR] {e}")
        sys.exit(1)
