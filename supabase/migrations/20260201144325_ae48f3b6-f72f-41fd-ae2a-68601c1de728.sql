-- Fix get_user_type to only allow querying own user_type (prevents information disclosure)
CREATE OR REPLACE FUNCTION public.get_user_type(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow querying own user_type to prevent information disclosure
  IF user_uuid != auth.uid() THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT user_type FROM public.profiles WHERE user_id = user_uuid LIMIT 1);
END;
$$;