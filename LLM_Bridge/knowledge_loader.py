# LLM_Bridge/knowledge_loader.py
import os
import pandas as pd
from typing import Optional, Tuple, List

from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_community.vectorstores.faiss import DistanceStrategy

# --- Env config ---
DEFAULT_CSV = os.getenv("FAQ_CSV_PATH", os.path.join(os.path.dirname(__file__), "faq.csv"))
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
INDEX_DIR   = os.getenv("FAQ_INDEX_DIR", os.path.join(os.path.dirname(__file__), "faiss_index"))
# Prefer explicit base url; fall back to host; finally localhost
OLLAMA_URL  = os.getenv("OLLAMA_BASE_URL") or os.getenv("OLLAMA_HOST") or "http://127.0.0.1:11434"

def _make_embeddings() -> OllamaEmbeddings:
    """Consistently create embeddings with the correct base_url."""
    return OllamaEmbeddings(
        model=EMBED_MODEL,
        base_url=OLLAMA_URL,  # critical: never fall back to implicit localhost
    )

def load_faq_csv(csv_path: Optional[str] = None) -> List[Document]:
    csv_path = csv_path or DEFAULT_CSV
    df = pd.read_csv(csv_path)

    # Normalize headings
    cols = {c.lower().strip(): c for c in df.columns}
    q_col = cols.get("question")
    a_col = cols.get("answer")
    if not q_col or not a_col:
        raise ValueError("CSV must contain columns: 'Question' and 'Answer'")

    docs: List[Document] = []
    for _, row in df.iterrows():
        q = str(row[q_col]).strip()
        a = str(row[a_col]).strip()
        if not q or not a:
            continue
        # Index both Q + A to improve recall
        docs.append(Document(
            page_content=f"Q: {q}\nA: {a}",
            metadata={"answer": a}
        ))
    return docs

def build_or_load_vectorstore(csv_path: Optional[str] = None) -> Tuple[FAISS, OllamaEmbeddings]:
    embeddings = _make_embeddings()

    # Try loading existing index
    if os.path.isdir(INDEX_DIR) and os.listdir(INDEX_DIR):
        try:
            vs = FAISS.load_local(INDEX_DIR, embeddings, allow_dangerous_deserialization=True)
            return vs, embeddings
        except Exception:
            pass  # fall through and rebuild

    docs = load_faq_csv(csv_path)
    vs = FAISS.from_documents(
        docs,
        embeddings,
        distance_strategy=DistanceStrategy.COSINE,  # key change
    )

    os.makedirs(INDEX_DIR, exist_ok=True)
    vs.save_local(INDEX_DIR)
    return vs, embeddings

def reload_vectorstore(csv_path: Optional[str] = None) -> FAISS:
    vs, _ = build_or_load_vectorstore(csv_path)
    return vs
