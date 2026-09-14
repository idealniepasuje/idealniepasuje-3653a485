-- Profile readiness v2: separate "tests completed" from "full profile".
-- Legacy candidates (version 1) match on all_tests_completed (comp + culture only).
-- New candidates (version 2) match on profile_ready (comp + culture + additional).
--
-- Does NOT bulk-recompute existing flags — run the optional recompute script separately.

-- 1) Version column: all existing rows become legacy (v1)
ALTER TABLE public.candidate_test_results
  ADD COLUMN IF NOT EXISTS profile_requirements_version integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.candidate_test_results.profile_requirements_version IS
  '1 = legacy (matching gated by all_tests_completed). 2+ = new (matching gated by profile_ready).';

UPDATE public.candidate_test_results
SET profile_requirements_version = 1
WHERE profile_requirements_version IS DISTINCT FROM 1;

-- New signups / inserts after this migration get version 2
ALTER TABLE public.candidate_test_results
  ALTER COLUMN profile_requirements_version SET DEFAULT 2;

-- 2) Recompute trigger flags (tests vs full profile)
CREATE OR REPLACE FUNCTION public.compute_candidate_profile_ready()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  comp_ok boolean;
  cult_ok boolean;
  add_ok boolean;
  lang_ok boolean;
BEGIN
  -- "getting_to_know" answers are OPTIONAL and never gate additional_completed.
  comp_ok := NEW.komunikacja_score IS NOT NULL
         AND NEW.myslenie_analityczne_score IS NOT NULL
         AND NEW.out_of_the_box_score IS NOT NULL
         AND NEW.determinacja_score IS NOT NULL
         AND NEW.adaptacja_score IS NOT NULL;

  cult_ok := COALESCE(NEW.culture_test_completed, false)
         AND NEW.culture_relacja_wspolpraca IS NOT NULL
         AND NEW.culture_elastycznosc_innowacyjnosc IS NOT NULL
         AND NEW.culture_wyniki_cele IS NOT NULL
         AND NEW.culture_stabilnosc_struktura IS NOT NULL
         AND NEW.culture_autonomia_styl_pracy IS NOT NULL
         AND NEW.culture_wlb_dobrostan IS NOT NULL;

  -- Languages: an explicit answer is required for each of the 4 languages.
  -- 'none' is a valid, deliberate answer.
  lang_ok := NULLIF(TRIM(COALESCE(NEW.lang_english, '')), '') IS NOT NULL
         AND NULLIF(TRIM(COALESCE(NEW.lang_spanish, '')), '') IS NOT NULL
         AND NULLIF(TRIM(COALESCE(NEW.lang_german, '')), '') IS NOT NULL
         AND NULLIF(TRIM(COALESCE(NEW.lang_polish, '')), '') IS NOT NULL;

  add_ok := NULLIF(TRIM(COALESCE(NEW.work_mode, '')), '') IS NOT NULL
        AND (NEW.work_mode = 'remote' OR NULLIF(TRIM(COALESCE(NEW.city, '')), '') IS NOT NULL)
        AND (COALESCE(NEW.has_no_experience, false)
             OR jsonb_array_length(COALESCE(NEW.industry_experiences, '[]'::jsonb)) > 0)
        AND COALESCE(array_length(NEW.target_industries, 1), 0) > 0
        AND lang_ok;

  NEW.competency_tests_completed := comp_ok;
  NEW.additional_completed := add_ok;
  NEW.all_tests_completed := comp_ok AND cult_ok;
  NEW.profile_ready := comp_ok AND cult_ok AND add_ok;

  RETURN NEW;
END;
$function$;
