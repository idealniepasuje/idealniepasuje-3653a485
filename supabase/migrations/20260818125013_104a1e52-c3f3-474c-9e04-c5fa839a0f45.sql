CREATE OR REPLACE FUNCTION public.compute_candidate_profile_ready()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  gtk jsonb;
  gtk_ok boolean;
  comp_ok boolean;
  cult_ok boolean;
  add_ok boolean;
  lang_ok boolean;
BEGIN
  gtk := COALESCE(NEW.getting_to_know, '{}'::jsonb);

  gtk_ok := NULLIF(TRIM(COALESCE(gtk->>'tasks', '')), '') IS NOT NULL
        AND NULLIF(TRIM(COALESCE(gtk->>'problems', '')), '') IS NOT NULL
        AND NULLIF(TRIM(COALESCE(gtk->>'motivation', '')), '') IS NOT NULL
        AND NULLIF(TRIM(COALESCE(gtk->>'proud_of', '')), '') IS NOT NULL;

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
        AND gtk_ok
        AND lang_ok;

  NEW.additional_completed := add_ok;
  NEW.competency_tests_completed := comp_ok;
  NEW.all_tests_completed := comp_ok AND cult_ok AND add_ok;
  NEW.profile_ready := NEW.all_tests_completed;

  RETURN NEW;
END;
$function$;

-- Recompute existing rows through the trigger (no match_results changes)
UPDATE public.candidate_test_results SET updated_at = updated_at;