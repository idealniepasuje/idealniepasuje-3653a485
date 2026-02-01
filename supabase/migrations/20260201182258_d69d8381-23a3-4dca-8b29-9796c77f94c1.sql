-- Enable RLS on the profiles_public view
-- Note: Views with security_invoker=on already inherit base table RLS,
-- but we add explicit policies for defense-in-depth

ALTER VIEW public.profiles_public SET (security_invoker = on);

-- Create RLS policies on the view matching the base table policies
-- First, we need to convert to a materialized approach or use a function
-- Since views can't have RLS directly in PostgreSQL, we'll create a secure function instead

-- Drop the view and recreate as a security definer function that respects RLS
DROP VIEW IF EXISTS public.profiles_public;

-- Create a secure function to get public profile data (excluding email)
-- This function respects the caller's permissions
CREATE OR REPLACE FUNCTION public.get_profile_public(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  user_type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.user_type,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_profile_public(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_profile_public IS 'Secure function to get public profile data excluding email. Respects RLS on profiles table.';