-- 1) Deduplicate: keep the newest message per (match, type, request tag)
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY match_result_id, type, COALESCE(metadata->>'field', metadata->>'request', '')
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM public.candidate_messages
  WHERE match_result_id IS NOT NULL
)
DELETE FROM public.candidate_messages cm
USING ranked r
WHERE cm.id = r.id AND r.rn > 1;

-- 2) Prevent future duplicates of the same request kind for the same match
CREATE UNIQUE INDEX IF NOT EXISTS candidate_messages_unique_request
  ON public.candidate_messages (
    match_result_id,
    type,
    (COALESCE(metadata->>'field', metadata->>'request', ''))
  )
  WHERE match_result_id IS NOT NULL;