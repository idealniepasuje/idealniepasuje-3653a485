-- Fix the permissive RLS policy for match_results INSERT
-- Drop the too permissive policy
DROP POLICY IF EXISTS "System can insert matches" ON public.match_results;

-- Create a more restrictive policy - only employers can create matches
CREATE POLICY "Employers can create matches"
ON public.match_results
FOR INSERT
WITH CHECK (
  auth.uid() = employer_user_id AND
  public.get_user_type(auth.uid()) = 'employer'
);