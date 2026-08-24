-- Backfill (legacy behaviour: offers predating internal analysis were external)
UPDATE public.job_offers
SET recruit_external_candidates = true
WHERE COALESCE(analyze_internal_team, false) = false
  AND COALESCE(recruit_external_candidates, false) = false;

ALTER TABLE public.job_offers
  ADD CONSTRAINT job_offers_at_least_one_mode_chk
  CHECK (COALESCE(analyze_internal_team, false) OR COALESCE(recruit_external_candidates, false))
  NOT VALID;

ALTER TABLE public.job_offers VALIDATE CONSTRAINT job_offers_at_least_one_mode_chk;