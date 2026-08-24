REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_manager(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_active_org_employee(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_manager(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_org_employee(uuid, uuid) TO authenticated;