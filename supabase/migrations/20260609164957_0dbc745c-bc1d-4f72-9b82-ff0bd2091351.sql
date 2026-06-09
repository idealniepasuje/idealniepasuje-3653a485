
-- 1. candidate_test_results: require match status = 'interested' for employer reads
DROP POLICY IF EXISTS "Employers can view matched candidates" ON public.candidate_test_results;
CREATE POLICY "Employers can view interested matched candidates"
ON public.candidate_test_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.match_results
    WHERE match_results.candidate_user_id = candidate_test_results.user_id
      AND match_results.employer_user_id = auth.uid()
      AND match_results.status = 'interested'
  )
);

-- 2. employer_profiles: require match status = 'interested' for candidate reads
DROP POLICY IF EXISTS "Candidates can view matched employers" ON public.employer_profiles;
CREATE POLICY "Candidates can view interested matched employers"
ON public.employer_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.match_results
    WHERE match_results.employer_user_id = employer_profiles.user_id
      AND match_results.candidate_user_id = auth.uid()
      AND match_results.status = 'interested'
  )
);

-- 3. audit_log: revoke client INSERT; use SECURITY DEFINER RPC instead
DROP POLICY IF EXISTS "Users can insert own audit entries" ON public.audit_log;
REVOKE INSERT ON public.audit_log FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _table_name text,
  _record_id uuid DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.audit_log (user_id, action, table_name, record_id, details)
  VALUES (auth.uid(), _action, _table_name, _record_id, COALESCE(_details, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event(text, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, jsonb) TO authenticated;

-- 4. candidate_messages: only allow updating read_at column
REVOKE UPDATE ON public.candidate_messages FROM authenticated;
GRANT UPDATE (read_at) ON public.candidate_messages TO authenticated;

-- 5. _audit_repair_log: explicit deny for non-service-role access
CREATE POLICY "Service role only - no client access"
ON public._audit_repair_log
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);
