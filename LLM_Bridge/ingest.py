# LLM_Bridge/ingest.py
import os
import re
import time
import pandas as pd
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from sqlalchemy import create_engine, text
from langchain_community.embeddings import OllamaEmbeddings

# --- Config ---
DB_URL = os.getenv("RAG_DB_URL", "postgresql+psycopg://user:pass@localhost:5432/flexbo")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
BASE_URL = os.getenv("SITE_BASE_URL", "https://flexbo-en.athenalabo.com/")  # your site root
USER_AGENT = os.getenv("CRAWL_UA", "FlexboBot/1.0 (+https://flexbo-en.athenalabo.com)")

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))   # chars or tokens (here chars)
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "120"))

engine = create_engine(DB_URL, future=True)
emb = OllamaEmbeddings(model=EMBED_MODEL)

def upsert_chunk(row: Dict):
    with engine.begin() as conn:
        # Insert; if you want dedup by (url,content) add a unique index + ON CONFLICT
        conn.execute(text("""
            INSERT INTO kb_chunks (source_type, url, title, section_anchor, content, embedding)
            VALUES (:source_type, :url, :title, :section_anchor, :content, :embedding)
        """), {
            **row,
            "embedding": row["embedding"]  # psycopg3 handles numpy->list
        })

def chunk_text(text: str, size=CHUNK_SIZE, overlap=CHUNK_OVERLAP) -> List[str]:
    text = re.sub(r'\s+', ' ', text).strip()
    chunks = []
    i = 0
    while i < len(text):
        chunk = text[i:i+size]
        chunks.append(chunk)
        i += size - overlap
        if i < 0 or i >= len(text): break
    return chunks

# ------- CSV ingestion -------
def ingest_csv(csv_path: str):
    df = pd.read_csv(csv_path)
    cols = {c.lower().strip(): c for c in df.columns}
    q_col = cols.get("question")
    a_col = cols.get("answer")
    if not q_col or not a_col:
        raise ValueError("CSV must have columns: Question, Answer")

    for _, row in df.iterrows():
        q = str(row[q_col]).strip()
        a = str(row[a_col]).strip()
        if not q or not a:
            continue
        # Store Q and A as one chunk (makes answers direct)
        text = f"Q: {q}\nA: {a}"
        for ch in chunk_text(text):
            vector = emb.embed_query(ch)
            upsert_chunk({
                "source_type": "csv",
                "url": None,
                "title": "FAQ CSV",
                "section_anchor": None,
                "content": ch,
                "embedding": vector
            })

# ------- Website ingestion -------
def fetch_html(url: str) -> Optional[str]:
    try:
        r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=15)
        if r.status_code == 200 and "text/html" in r.headers.get("Content-Type", ""):
            return r.text
    except Exception:
        return None
    return None

def extract_links(html: str, base: str) -> List[str]:
    soup = BeautifulSoup(html, "lxml")
    links = []
    for a in soup.select("a[href]"):
        href = a["href"]
        if href.startswith("#"):  # same-page anchor
            continue
        absolute = urljoin(base, href)
        if absolute.startswith(base):
            links.append(absolute.split("#")[0])  # normalize without anchors
    return sorted(set(links))

def extract_readable_content(html: str) -> Tuple[str, str]:
    soup = BeautifulSoup(html, "lxml")
    # Title
    title = (soup.title.string.strip() if soup.title and soup.title.string else "")
    # Remove nav/footer/scripts etc.
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    # Keep main + article if present, else body text
    main = soup.select_one("main") or soup.select_one("article") or soup.body
    text = main.get_text(separator=" ", strip=True) if main else soup.get_text(separator=" ", strip=True)
    return title, text

def crawl_site(seed_urls: List[str], max_pages=100):
    seen = set()
    queue = list(seed_urls)
    count = 0

    while queue and count < max_pages:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)

        html = fetch_html(url)
        if not html:
            continue

        title, text = extract_readable_content(html)
        if not text:
            continue

        # Chunk and store with URL (for citations)
        for ch in chunk_text(text):
            vector = emb.embed_query(ch)
            upsert_chunk({
                "source_type": "web",
                "url": url,
                "title": title or url,
                "section_anchor": None,   # optional: compute anchors from headings
                "content": ch,
                "embedding": vector
            })

        count += 1
        # discover more links (stay within your domain)
        for link in extract_links(html, url):
            if link.startswith(BASE_URL) and link not in seen:
                queue.append(link)

if __name__ == "__main__":
    # Example usage:
    csv = os.getenv("FAQ_CSV_PATH", os.path.join(os.path.dirname(__file__), "faq.csv"))
    if os.path.isfile(csv):
        print(f"Ingesting CSV: {csv}")
        ingest_csv(csv)
    # Seed with homepage + key sections
    seeds = [
        BASE_URL,
        urljoin(BASE_URL, "products"),
        urljoin(BASE_URL, "about"),
        urljoin(BASE_URL, "contact"),
        # add any other key pages or sitemaps
    ]
    print("Crawling site...")
    crawl_site(seeds, max_pages=int(os.getenv("MAX_PAGES", "200")))
    print("Done.")
# This script will ingest a CSV FAQ and crawl the website to build a knowledge base.
# It uses Ollama for embeddings and stores results in a PostgreSQL database.
# Make sure to set the environment variables as needed.