
-- Audit log table for tracking sensitive data access and changes
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user-based queries
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view own audit log
CREATE POLICY "Users can view own audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own audit entries
CREATE POLICY "Users can insert own audit entries"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Audit log cannot be updated or deleted
CREATE POLICY "Audit log is immutable - no updates"
  ON public.audit_log FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Audit log is immutable - no deletes"
  ON public.audit_log FOR DELETE
  TO authenticated
  USING (false);

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to audit_log"
  ON public.audit_log FOR SELECT
  TO public
  USING (auth.uid() IS NOT NULL);

-- Add audit_log cleanup to user deletion trigger
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.audit_log WHERE user_id = OLD.id;
  DELETE FROM public.match_results WHERE candidate_user_id = OLD.id OR employer_user_id = OLD.id;
  DELETE FROM public.candidate_feedback WHERE user_id = OLD.id;
  DELETE FROM public.employer_feedback WHERE user_id = OLD.id;
  DELETE FROM public.job_offers WHERE user_id = OLD.id;
  DELETE FROM public.candidate_test_results WHERE user_id = OLD.id;
  DELETE FROM public.employer_profiles WHERE user_id = OLD.id;
  DELETE FROM public.profiles WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;
