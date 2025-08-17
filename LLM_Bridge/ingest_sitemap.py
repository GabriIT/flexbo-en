import os
import re
import requests
import pandas as pd
from typing import List, Dict, Optional
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

from sqlalchemy import create_engine, text
from langchain_community.embeddings import OllamaEmbeddings
from bs4 import BeautifulSoup

DB_URL = os.getenv("RAG_DB_URL") # "postgresql+psycopg://user:pass@localhost:5432/flexbo")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
SITEMAP_URL = os.getenv("SITEMAP_URL", "https://flexbo-en.athenalabo.com/sitemap.xml")
USER_AGENT = os.getenv("CRAWL_UA", "FlexboBot/1.0 (+https://flexbo-en.athenalabo.com)")

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "120"))

engine = create_engine(DB_URL, future=True)
emb = OllamaEmbeddings(model=EMBED_MODEL)

def chunk_text(text: str, size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    text = re.sub(r"\s+", " ", text).strip()
    out, i = [], 0
    while i < len(text):
        out.append(text[i:i+size])
        i += max(1, size - overlap)
    return out

def upsert_chunk(row: Dict):
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO kb_chunks (source_type, url, title, section_anchor, content, embedding)
            VALUES (:source_type, :url, :title, :section_anchor, :content, :embedding)
        """), row)

def parse_sitemap(sitemap_url: str) -> List[str]:
    r = requests.get(sitemap_url, timeout=15, headers={"User-Agent": USER_AGENT})
    r.raise_for_status()
    root = ET.fromstring(r.text)
    ns = {"sm": "https://www.sitemaps.org/schemas/sitemap/0.9"}
    locs = []
    # handle both <urlset> and <sitemapindex>
    if root.tag.endswith("urlset"):
        for url in root.findall("sm:url", ns):
            loc = url.find("sm:loc", ns)
            if loc is not None and loc.text:
                locs.append(loc.text.strip())
    elif root.tag.endswith("sitemapindex"):
        # follow nested sitemaps
        for smp in root.findall("sm:sitemap", ns):
            loc = smp.find("sm:loc", ns)
            if loc is not None and loc.text:
                locs.extend(parse_sitemap(loc.text.strip()))
    return sorted(set(locs))

def fetch_html(url: str) -> Optional[str]:
    try:
        r = requests.get(url, timeout=20, headers={"User-Agent": USER_AGENT})
        if r.status_code == 200 and "text/html" in r.headers.get("Content-Type", ""):
            return r.text
    except Exception:
        pass
    return None

def extract_readable_content(html: str):
    soup = BeautifulSoup(html, "lxml")
    title = (soup.title.string.strip() if soup.title and soup.title.string else "")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    main = soup.select_one("main") or soup.select_one("article") or soup.body
    text = main.get_text(separator=" ", strip=True) if main else soup.get_text(separator=" ", strip=True)
    return title, text

def ingest_pages(urls: List[str]):
    for url in urls:
        html = fetch_html(url)
        if not html:
            continue
        title, text = extract_readable_content(html)
        if not text:
            continue
        for chunk in chunk_text(text):
            vector = emb.embed_query(chunk)
            upsert_chunk({
                "source_type": "web",
                "url": url,
                "title": title or url,
                "section_anchor": None,
                "content": chunk,
                "embedding": vector
            })

if __name__ == "__main__":
    # 1) Ensure table exists
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

    # 2) Pull URLs from sitemap
    urls = parse_sitemap(SITEMAP_URL)
    print(f"Discovered {len(urls)} URLs from sitemap.")

    # 3) Ingest them
    ingest_pages(urls)
    print("Sitemap ingestion complete.")
