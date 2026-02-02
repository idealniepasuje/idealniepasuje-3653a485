-- Add unique constraint for employer-candidate pair to enable upsert
ALTER TABLE public.match_results 
ADD CONSTRAINT match_results_employer_candidate_unique 
UNIQUE (employer_user_id, candidate_user_id);