
You’ve already got duplicate rows in `kb_chunks` (same `source_type`, same `url` (NULL→''), and same `content_hash`). Postgres refuses to create the unique index until you clean those up.

Here’s a clean, safe sequence you can run in psql to (1) add the `content_hash` column, (2) find and remove dupes, then (3) create the unique index, and (4) make the ingester idempotent going forward.

---

# 1) Add `content_hash` (if missing) and backfill

```sql
ALTER TABLE kb_chunks
  ADD COLUMN IF NOT EXISTS content_hash text;

-- backfill only where null
UPDATE kb_chunks
SET content_hash = md5(content)
WHERE content_hash IS NULL;
```

# 2) Inspect duplicates

```sql
-- which groups have duplicates?
SELECT source_type,
       COALESCE(url, '') AS url_key,
       content_hash,
       COUNT(*) AS n,
       MIN(id) AS keep_id
FROM kb_chunks
GROUP BY 1,2,3
HAVING COUNT(*) > 1
ORDER BY n DESC
LIMIT 50;
```

# 3) Remove duplicates (keep the smallest id per group)

```sql
WITH dups AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY source_type, COALESCE(url, ''), content_hash
           ORDER BY id
         ) AS rn
  FROM kb_chunks
)
DELETE FROM kb_chunks
USING dups
WHERE kb_chunks.id = dups.id
  AND dups.rn > 1;
```

> Re-run the duplicate check (Step 2). It should return **0 rows**.

# 4) Create the unique index

```sql
CREATE UNIQUE INDEX uq_kb_unique
ON kb_chunks (source_type, COALESCE(url, ''), content_hash);
```

(Optional) If the table is big and you can’t lock it long, use `CONCURRENTLY`:

```sql
CREATE UNIQUE INDEX CONCURRENTLY uq_kb_unique
ON kb_chunks (source_type, COALESCE(url, ''), content_hash);
```

---

## 5) Make the ingester idempotent (so dupes don’t come back)

In `ingest_csv_to_kb.py`, change `upsert_chunk` to compute the hash and **ON CONFLICT DO NOTHING** against the index above:

```python
def upsert_chunk(row: Dict):
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO kb_chunks (source_type, url, title, section_anchor, content, embedding, content_hash)
            VALUES (:source_type, :url, :title, :section_anchor, :content, :embedding, md5(:content))
            ON CONFLICT (source_type, COALESCE(url,''), content_hash) DO NOTHING
        """), row)
```

(That `ON CONFLICT` only works after Step 4’s unique index exists.)

### Tip: no-chunking for CSV (optional)

If you’d rather have 1 row per Q/A (and further reduce duplicates), skip chunking for CSV:

```python
text_block = f"Q: {q}\nA: {a}"
vec = emb.embed_query(text_block)
upsert_chunk({
    "source_type": "csv",
    "url": None,
    "title": "FAQ CSV",
    "section_anchor": None,
    "content": text_block,
    "embedding": vec,
})
```

---

## 6) Sanity checks after fixes

```sql
-- should be zero
SELECT COUNT(*) FROM (
  SELECT 1
  FROM kb_chunks
  GROUP BY source_type, COALESCE(url, ''), content_hash
  HAVING COUNT(*) > 1
) x;

-- confirm index exists
\d kb_chunks
-- look for: "uq_kb_unique" UNIQUE, btree (source_type, COALESCE(url, ''::text), content_hash)
```

Once you’ve done this, re-run the ingester whenever you want—duplicates won’t accumulate, and your search will behave consistently.
