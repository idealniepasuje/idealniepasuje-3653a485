CREATE OR REPLACE FUNCTION public.compute_candidate_profile_ready()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  gtk jsonb;
  q1 text; q2 text; q3 text; q4 text;
BEGIN
  gtk := COALESCE(NEW.getting_to_know, '{}'::jsonb);
  q1 := NULLIF(TRIM(COALESCE(gtk->>'tasks', '')), '');
  q2 := NULLIF(TRIM(COALESCE(gtk->>'problems', '')), '');
  q3 := NULLIF(TRIM(COALESCE(gtk->>'motivation', '')), '');
  q4 := NULLIF(TRIM(COALESCE(gtk->>'proud_of', '')), '');

  NEW.profile_ready := (q1 IS NOT NULL AND q2 IS NOT NULL AND q3 IS NOT NULL AND q4 IS NOT NULL);
  RETURN NEW;
END;
$function$;

UPDATE public.candidate_test_results SET updated_at = updated_at;