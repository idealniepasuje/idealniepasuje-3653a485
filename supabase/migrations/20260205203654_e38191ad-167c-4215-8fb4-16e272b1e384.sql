-- Allow one match per (employer, candidate, job order)
BEGIN;

-- Remove legacy uniqueness that forced only one match per employer-candidate pair
ALTER TABLE public.match_results
  DROP CONSTRAINT IF EXISTS match_results_candidate_user_id_employer_user_id_key;

ALTER TABLE public.match_results
  DROP CONSTRAINT IF EXISTS match_results_employer_candidate_unique;

-- New uniqueness: one match per employer-candidate per job offer
ALTER TABLE public.match_results
  ADD CONSTRAINT match_results_employer_candidate_offer_unique
  UNIQUE (employer_user_id, candidate_user_id, job_offer_id);

COMMIT;