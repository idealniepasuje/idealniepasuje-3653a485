ALTER TABLE public.match_results DROP CONSTRAINT IF EXISTS match_results_status_check;

UPDATE public.match_results SET status = 'considering' WHERE status = 'accepted';

ALTER TABLE public.match_results
  ADD CONSTRAINT match_results_status_check
  CHECK (status IN ('pending', 'viewed', 'considering', 'rejected'));

DROP POLICY IF EXISTS "Employers can view interested matched candidates" ON public.candidate_test_results;
CREATE POLICY "Employers can view interested matched candidates"
ON public.candidate_test_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.match_results
    WHERE match_results.candidate_user_id = candidate_test_results.user_id
      AND match_results.employer_user_id = auth.uid()
      AND match_results.status = 'considering'
  )
);

DROP POLICY IF EXISTS "Candidates can view interested matched employers" ON public.employer_profiles;
CREATE POLICY "Candidates can view interested matched employers"
ON public.employer_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.match_results
    WHERE match_results.employer_user_id = employer_profiles.user_id
      AND match_results.candidate_user_id = auth.uid()
      AND match_results.status = 'considering'
  )
);