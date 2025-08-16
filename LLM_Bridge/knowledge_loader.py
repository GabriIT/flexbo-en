# LLM_Bridge/knowledge_loader.py
import os
import pandas as pd
from typing import Optional, Tuple, List

from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

DEFAULT_CSV = os.getenv("FAQ_CSV_PATH", os.path.join(os.path.dirname(__file__), "faq.csv"))
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
INDEX_DIR = os.getenv("FAQ_INDEX_DIR", os.path.join(os.path.dirname(__file__), "faiss_index"))

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
        # We index by Question text; store the Answer in metadata
        docs.append(Document(page_content=q, metadata={"answer": a}))
    return docs

def build_or_load_vectorstore(csv_path: Optional[str] = None) -> Tuple[FAISS, OllamaEmbeddings]:
    embeddings = OllamaEmbeddings(model=EMBED_MODEL)  # Uses OLLAMA_HOST if set
    # Try loading existing index
    if os.path.isdir(INDEX_DIR) and os.listdir(INDEX_DIR):
        try:
            vs = FAISS.load_local(INDEX_DIR, embeddings, allow_dangerous_deserialization=True)
            return vs, embeddings
        except Exception:
            pass  # fallthrough and rebuild

    docs = load_faq_csv(csv_path)
    vs = FAISS.from_documents(docs, embeddings)
    vs.save_local(INDEX_DIR)
    return vs, embeddings

def reload_vectorstore(csv_path: Optional[str] = None) -> FAISS:
    vs, _ = build_or_load_vectorstore(csv_path)
    return vs
