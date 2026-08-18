DROP INDEX IF EXISTS public.candidate_messages_unique_request;

CREATE UNIQUE INDEX candidate_messages_unique_request
  ON public.candidate_messages (
    match_result_id,
    type,
    COALESCE(metadata->>'field', metadata->>'request', '')
  )
  WHERE match_result_id IS NOT NULL
    AND type NOT IN ('employer_reply', 'interview_response');

CREATE UNIQUE INDEX candidate_messages_employer_reply_request_uniq
  ON public.candidate_messages (match_result_id, (metadata->>'client_request_id'))
  WHERE type = 'employer_reply' AND metadata->>'client_request_id' IS NOT NULL;