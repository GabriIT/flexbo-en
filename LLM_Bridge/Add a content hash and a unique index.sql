-- Add a content hash and a unique index, then use upsert:

-- ALTER TABLE kb_chunks ADD COLUMN IF NOT EXISTS content_hash text;

-- safe backfill (may take a moment):

-- UPDATE kb_chunks SET content_hash = md5(content) WHERE content_hash IS NULL;

-- enforce uniqueness per source and URL (NULL-safe via COALESCE)
CREATE UNIQUE INDEX IF NOT EXISTS uq_kb_unique
ON kb_chunks (source_type, COALESCE(url,''), content_hash);
