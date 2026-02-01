-- Add policies to deny anonymous access to all tables

-- profiles table - deny anonymous access
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- candidate_test_results table - deny anonymous access  
CREATE POLICY "Deny anonymous access to candidate_test_results" 
ON public.candidate_test_results 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- employer_profiles table - deny anonymous access
CREATE POLICY "Deny anonymous access to employer_profiles" 
ON public.employer_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- match_results table - deny anonymous access
CREATE POLICY "Deny anonymous access to match_results" 
ON public.match_results 
FOR SELECT 
USING (auth.uid() IS NOT NULL);