-- Backfill: close requests whose requirement is already satisfied.
UPDATE public.candidate_messages m
   SET read_at = now()
  FROM public.candidate_test_results r
 WHERE r.user_id = m.candidate_user_id
   AND m.read_at IS NULL
   AND (
        (m.type = 'linkedin_request' AND COALESCE(TRIM(r.linkedin_url), '') <> '')
     OR (m.type = 'tools_completion_request'
         AND jsonb_typeof(COALESCE(r.tools, '[]'::jsonb)) = 'array'
         AND jsonb_array_length(COALESCE(r.tools, '[]'::jsonb)) > 0)
     OR (m.type = 'profile_completion' AND COALESCE(r.additional_completed, false) = true)
   );

-- Backfill: close interview invitations the candidate already answered.
UPDATE public.candidate_messages m
   SET read_at = now()
 WHERE m.read_at IS NULL
   AND m.type = 'interview_invite'
   AND EXISTS (
     SELECT 1 FROM public.candidate_messages resp
      WHERE resp.type = 'interview_response'
        AND resp.match_result_id = m.match_result_id
        AND resp.candidate_user_id = m.candidate_user_id
   );