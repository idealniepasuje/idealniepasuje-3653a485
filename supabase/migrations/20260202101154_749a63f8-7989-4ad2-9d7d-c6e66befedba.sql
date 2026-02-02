-- Fix the handle_new_user function - remove email column that doesn't exist in profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
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