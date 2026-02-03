-- Drop and recreate the handle_new_user function with better name extraction
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  extracted_name TEXT;
BEGIN
  -- Extract name from various possible metadata fields (OAuth providers use different keys)
  extracted_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'given_name' || ' ' || COALESCE(NEW.raw_user_meta_data->>'family_name', '')), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name' || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', '')), ''),
    'Nieznany'
  );
  
  INSERT INTO public.profiles (user_id, full_name, user_type)
  VALUES (
    NEW.id,
    extracted_name,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate')
  );
  
  -- Create corresponding records based on user type
  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate') = 'candidate' THEN
    INSERT INTO public.candidate_test_results (user_id) VALUES (NEW.id);
  ELSE
    INSERT INTO public.employer_profiles (user_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;