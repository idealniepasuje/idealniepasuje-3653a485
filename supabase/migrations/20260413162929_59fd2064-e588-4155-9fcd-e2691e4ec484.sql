
-- 1. Drop the overly permissive "Deny anonymous access to match_results" policy
-- This policy allows ANY authenticated user to read ALL match_results rows
DROP POLICY IF EXISTS "Deny anonymous access to match_results" ON public.match_results;

-- 2. Prevent users from changing their own user_type via profiles UPDATE
-- Drop existing policy and recreate with column restriction
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a trigger to prevent user_type changes
CREATE OR REPLACE FUNCTION public.prevent_user_type_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    RAISE EXCEPTION 'Changing user_type is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_user_type_change_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_type_change();
