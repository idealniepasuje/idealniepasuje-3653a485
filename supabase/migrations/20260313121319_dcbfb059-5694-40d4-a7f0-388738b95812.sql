
-- Create a function that deletes all user data from public tables when auth user is deleted
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.match_results WHERE candidate_user_id = OLD.id OR employer_user_id = OLD.id;
  DELETE FROM public.candidate_feedback WHERE user_id = OLD.id;
  DELETE FROM public.employer_feedback WHERE user_id = OLD.id;
  DELETE FROM public.job_offers WHERE user_id = OLD.id;
  DELETE FROM public.candidate_test_results WHERE user_id = OLD.id;
  DELETE FROM public.employer_profiles WHERE user_id = OLD.id;
  DELETE FROM public.profiles WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;

-- Create trigger on auth.users BEFORE delete
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deletion();
