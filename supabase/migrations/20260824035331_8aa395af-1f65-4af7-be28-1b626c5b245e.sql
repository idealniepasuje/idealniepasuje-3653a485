-- 1) Wyczyść wyniki analiz bez zgody
UPDATE public.internal_assessments
   SET overall_percent = NULL,
       competence_percent = NULL,
       culture_percent = NULL,
       extra_percent = NULL,
       match_details = NULL,
       computed_at = NULL
 WHERE consent_status IS DISTINCT FROM 'granted'
   AND (overall_percent IS NOT NULL OR competence_percent IS NOT NULL OR culture_percent IS NOT NULL
        OR extra_percent IS NOT NULL OR match_details IS NOT NULL OR computed_at IS NOT NULL);

-- 2) Trigger: wyniki mogą istnieć wyłącznie przy consent_status = 'granted'
CREATE OR REPLACE FUNCTION public.enforce_internal_assessment_consent()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.consent_status IS DISTINCT FROM 'granted' THEN
    NEW.overall_percent := NULL;
    NEW.competence_percent := NULL;
    NEW.culture_percent := NULL;
    NEW.extra_percent := NULL;
    NEW.match_details := NULL;
    NEW.computed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_internal_assessment_consent ON public.internal_assessments;
CREATE TRIGGER trg_internal_assessment_consent
BEFORE INSERT OR UPDATE ON public.internal_assessments
FOR EACH ROW EXECUTE FUNCTION public.enforce_internal_assessment_consent();

-- 3) Odbierz uprawnienia anon
REVOKE ALL ON public.organizations FROM anon;
REVOKE ALL ON public.organization_members FROM anon;
REVOKE ALL ON public.organization_employees FROM anon;
REVOKE ALL ON public.organization_invitations FROM anon;
REVOKE ALL ON public.internal_assessments FROM anon;

GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_assessments TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT ALL ON public.organization_members TO service_role;
GRANT ALL ON public.organization_employees TO service_role;
GRANT ALL ON public.organization_invitations TO service_role;
GRANT ALL ON public.internal_assessments TO service_role;

-- 4) Ochrona roli 'owner' w organization_members
CREATE OR REPLACE FUNCTION public.enforce_org_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_owner uuid;
  actor uuid := auth.uid();
BEGIN
  -- Operacje serwisowe (bez kontekstu użytkownika) są dozwolone
  IF actor IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT o.owner_user_id INTO org_owner
    FROM public.organizations o
   WHERE o.id = COALESCE(NEW.organization_id, OLD.organization_id);

  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'owner' AND actor IS DISTINCT FROM org_owner THEN
      RAISE EXCEPTION 'Tylko właściciel organizacji może nadać rolę owner';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND actor IS DISTINCT FROM org_owner THEN
      RAISE EXCEPTION 'Tylko właściciel organizacji może zmieniać role';
    END IF;
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Nie można przenosić członkostwa między organizacjami';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' AND actor IS DISTINCT FROM org_owner THEN
      RAISE EXCEPTION 'Nie można usunąć właściciela organizacji';
    END IF;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_org_owner_role ON public.organization_members;
CREATE TRIGGER trg_enforce_org_owner_role
BEFORE INSERT OR UPDATE OR DELETE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_org_owner_role();

-- 5) Jeden właściciel = jedna organizacja
CREATE UNIQUE INDEX IF NOT EXISTS organizations_owner_user_id_key
  ON public.organizations (owner_user_id);