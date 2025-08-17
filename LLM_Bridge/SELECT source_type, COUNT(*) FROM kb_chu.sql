-- SELECT source_type, COUNT(*) FROM kb_chunks GROUP BY 1 ORDER BY 2 DESC;
SELECT source_type, AVG(length(content))::int AS avg_len, COUNT(*) 
FROM kb_chunks GROUP BY 1 ORDER BY 3 DESC;
