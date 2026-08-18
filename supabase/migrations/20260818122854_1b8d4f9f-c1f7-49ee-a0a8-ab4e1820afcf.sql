-- candidate_messages: column-level UPDATE
REVOKE UPDATE ON public.candidate_messages FROM authenticated;
GRANT UPDATE (read_at, employer_read_at) ON public.candidate_messages TO authenticated;
GRANT ALL ON public.candidate_messages TO service_role;

DROP POLICY IF EXISTS "Candidate can mark own messages as read" ON public.candidate_messages;
DROP POLICY IF EXISTS "Employer can mark own messages as read" ON public.candidate_messages;

CREATE POLICY "Candidate can mark own messages as read"
ON public.candidate_messages FOR UPDATE TO authenticated
USING (auth.uid() = candidate_user_id)
WITH CHECK (auth.uid() = candidate_user_id);

CREATE POLICY "Employer can mark own messages as read"
ON public.candidate_messages FOR UPDATE TO authenticated
USING (auth.uid() = employer_user_id)
WITH CHECK (auth.uid() = employer_user_id);

-- match_results: column-level UPDATE (lifecycle/operational fields only)
REVOKE UPDATE ON public.match_results FROM authenticated;
GRANT UPDATE (
  status,
  viewed_at,
  unlocked_at,
  linkedin_requested_at,
  profile_completion_requested_at,
  interview_invited_at,
  interview_type,
  interview_calendar_link,
  interview_message,
  tools_request_status,
  updated_at
) ON public.match_results TO authenticated;
GRANT ALL ON public.match_results TO service_role;

DROP POLICY IF EXISTS "Employers can update match status" ON public.match_results;

CREATE POLICY "Employers can update match status"
ON public.match_results FOR UPDATE TO authenticated
USING (auth.uid() = employer_user_id)
WITH CHECK (auth.uid() = employer_user_id);