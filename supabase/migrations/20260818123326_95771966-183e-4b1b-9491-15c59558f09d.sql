CREATE UNIQUE INDEX IF NOT EXISTS candidate_messages_interview_response_uniq
ON public.candidate_messages (match_result_id, candidate_user_id)
WHERE type = 'interview_response' AND match_result_id IS NOT NULL;