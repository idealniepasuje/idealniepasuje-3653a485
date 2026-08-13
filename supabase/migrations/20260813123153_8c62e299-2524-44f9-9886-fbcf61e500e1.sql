DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous access to candidate_test_results" ON public.candidate_test_results;
DROP POLICY IF EXISTS "Deny anonymous access to employer_profiles" ON public.employer_profiles;
DROP POLICY IF EXISTS "Deny anonymous access to candidate_feedback" ON public.candidate_feedback;
DROP POLICY IF EXISTS "Deny anonymous access to employer_feedback" ON public.employer_feedback;
DROP POLICY IF EXISTS "Deny anonymous access to audit_log" ON public.audit_log;
DROP POLICY IF EXISTS "Deny anonymous access to job_offers" ON public.job_offers;