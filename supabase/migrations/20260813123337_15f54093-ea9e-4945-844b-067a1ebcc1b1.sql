ALTER TABLE public.candidate_messages DROP CONSTRAINT IF EXISTS candidate_messages_type_check;
ALTER TABLE public.candidate_messages ADD CONSTRAINT candidate_messages_type_check
  CHECK (type IN ('linkedin_request','profile_completion','interview_invite','tools_completion_request'));