-- Create a secure view for profiles that excludes sensitive PII (email)
-- This view can be used for match-based queries without exposing email addresses

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT 
    id,
    user_id,
    full_name,
    user_type,
    created_at,
    updated_at
  FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO authenticated;

-- Add comment explaining purpose
COMMENT ON VIEW public.profiles_public IS 'Public view of profiles excluding sensitive PII (email). Use this view for match-based queries.';