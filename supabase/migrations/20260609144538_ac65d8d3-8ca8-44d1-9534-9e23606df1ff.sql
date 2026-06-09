
ALTER TABLE public._audit_repair_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._audit_repair_log FROM anon, authenticated;
