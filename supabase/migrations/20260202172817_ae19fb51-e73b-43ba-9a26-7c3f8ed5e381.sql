-- Add linkedin_url column to candidate_test_results
ALTER TABLE public.candidate_test_results
ADD COLUMN linkedin_url text;