# LLM_Bridge/knowledge_loader.py
import os
import numpy as np
import pandas as pd
from typing import Optional, Tuple, List

from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_community.vectorstores.faiss import DistanceStrategy

DEFAULT_CSV  = os.getenv("FAQ_CSV_PATH", os.path.join(os.path.dirname(__file__), "faq.csv"))
EMBED_MODEL  = os.getenv("EMBED_MODEL", "nomic-embed-text")
INDEX_DIR    = os.getenv("FAQ_INDEX_DIR", os.path.join(os.path.dirname(__file__), "faiss_index"))
OLLAMA_URL   = os.getenv("OLLAMA_BASE_URL") or os.getenv("OLLAMA_HOST") or "http://127.0.0.1:11434"

class NormalizedOllamaEmbeddings(OllamaEmbeddings):
    """Wrap OllamaEmbeddings and L2-normalize outputs for robust cosine/IP behavior."""
    def _l2norm(self, v):
        v = np.asarray(v, dtype=np.float32)
        n = np.linalg.norm(v)
        return (v / n).tolist() if n > 0 else v.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        vecs = super().embed_documents(texts)
        return [self._l2norm(v) for v in vecs]

    def embed_query(self, text: str) -> List[float]:
        v = super().embed_query(text)
        return self._l2norm(v)

def _make_embeddings() -> NormalizedOllamaEmbeddings:
    return NormalizedOllamaEmbeddings(model=EMBED_MODEL, base_url=OLLAMA_URL)

def load_faq_csv(csv_path: Optional[str] = None) -> List[Document]:
    csv_path = csv_path or DEFAULT_CSV
    df = pd.read_csv(csv_path)

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
        # ✅ Index ONLY the question as content; keep answer in metadata
        docs.append(Document(page_content=q, metadata={"answer": a}))
    return docs

def build_or_load_vectorstore(csv_path: Optional[str] = None) -> Tuple[FAISS, NormalizedOllamaEmbeddings]:
    embeddings = _make_embeddings()

    # Try load existing
    if os.path.isdir(INDEX_DIR) and os.listdir(INDEX_DIR):
        try:
            vs = FAISS.load_local(INDEX_DIR, embeddings, allow_dangerous_deserialization=True)
            return vs, embeddings
        except Exception:
            pass  # rebuild

    docs = load_faq_csv(csv_path)
    # Use COSINE strategy (LangChain will pick an IP index under the hood); our vectors are already L2-normalized
    vs = FAISS.from_documents(docs, embeddings, distance_strategy=DistanceStrategy.COSINE)
    os.makedirs(INDEX_DIR, exist_ok=True)
    vs.save_local(INDEX_DIR)
    return vs, embeddings

def reload_vectorstore(csv_path: Optional[str] = None) -> FAISS:
    vs, _ = build_or_load_vectorstore(csv_path)
    return vs
