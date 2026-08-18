ALTER TABLE public.candidate_messages
  ADD COLUMN IF NOT EXISTS employer_read_at timestamptz;

ALTER TABLE public.candidate_messages DROP CONSTRAINT IF EXISTS candidate_messages_type_check;
ALTER TABLE public.candidate_messages ADD CONSTRAINT candidate_messages_type_check
  CHECK (type IN ('profile_completion','profile_completion_request','linkedin_request','tools_request','tools_completion_request','unlock_profile','interview_invite','interview_response','employer_reply','general'));

DROP POLICY IF EXISTS "Employer can mark own messages as read" ON public.candidate_messages;
CREATE POLICY "Employer can mark own messages as read"
ON public.candidate_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = employer_user_id)
WITH CHECK (auth.uid() = employer_user_id);