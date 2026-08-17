REVOKE EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, jsonb) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, jsonb) TO authenticated, service_role;