
-- 1. candidate_test_results additions
ALTER TABLE public.candidate_test_results
  ADD COLUMN IF NOT EXISTS getting_to_know jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_ready boolean NOT NULL DEFAULT false;

-- 2. match_results additions
ALTER TABLE public.match_results
  ADD COLUMN IF NOT EXISTS unlocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS linkedin_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_completion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS interview_invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS interview_type text,
  ADD COLUMN IF NOT EXISTS interview_calendar_link text,
  ADD COLUMN IF NOT EXISTS interview_message text;

-- 3. candidate_messages table
CREATE TABLE IF NOT EXISTS public.candidate_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_result_id uuid,
  candidate_user_id uuid NOT NULL,
  employer_user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('linkedin_request','profile_completion','interview_invite')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.candidate_messages TO authenticated;
GRANT ALL ON public.candidate_messages TO service_role;

ALTER TABLE public.candidate_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidate can view own messages"
  ON public.candidate_messages FOR SELECT TO authenticated
  USING (auth.uid() = candidate_user_id);

CREATE POLICY "Employer can view own sent messages"
  ON public.candidate_messages FOR SELECT TO authenticated
  USING (auth.uid() = employer_user_id);

CREATE POLICY "Employer can send messages"
  ON public.candidate_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = employer_user_id AND public.get_user_type(auth.uid()) = 'employer');

CREATE POLICY "Candidate can mark own messages as read"
  ON public.candidate_messages FOR UPDATE TO authenticated
  USING (auth.uid() = candidate_user_id)
  WITH CHECK (auth.uid() = candidate_user_id);

CREATE INDEX IF NOT EXISTS idx_candidate_messages_candidate ON public.candidate_messages(candidate_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_messages_employer ON public.candidate_messages(employer_user_id, created_at DESC);

-- 4. Trigger to compute profile_ready
CREATE OR REPLACE FUNCTION public.compute_candidate_profile_ready()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  gtk jsonb;
  q1 text; q2 text; q3 text; q4 text;
  exp_ok boolean;
  work_desc_ok boolean;
BEGIN
  gtk := COALESCE(NEW.getting_to_know, '{}'::jsonb);
  q1 := NULLIF(TRIM(COALESCE(gtk->>'tasks', '')), '');
  q2 := NULLIF(TRIM(COALESCE(gtk->>'problems', '')), '');
  q3 := NULLIF(TRIM(COALESCE(gtk->>'motivation', '')), '');
  q4 := NULLIF(TRIM(COALESCE(gtk->>'proud_of', '')), '');
  exp_ok := COALESCE(NEW.has_no_experience, false) OR NEW.experience IS NOT NULL;
  work_desc_ok := NULLIF(TRIM(COALESCE(NEW.work_description, '')), '') IS NOT NULL;

  NEW.profile_ready := (
    q1 IS NOT NULL AND q2 IS NOT NULL AND q3 IS NOT NULL AND q4 IS NOT NULL
    AND exp_ok AND work_desc_ok
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_candidate_profile_ready ON public.candidate_test_results;
CREATE TRIGGER trg_candidate_profile_ready
BEFORE INSERT OR UPDATE ON public.candidate_test_results
FOR EACH ROW EXECUTE FUNCTION public.compute_candidate_profile_ready();
