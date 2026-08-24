-- 1) Column-level security: pracownik zmienia tylko zgodę, nie wyniki
REVOKE UPDATE ON public.internal_assessments FROM authenticated;
GRANT UPDATE (consent_status, consent_at, revoked_at, updated_at) ON public.internal_assessments TO authenticated;

-- 2) Znaczniki czasu zgody + kasowanie wyników (rozszerzenie istniejącego triggera)
CREATE OR REPLACE FUNCTION public.enforce_internal_assessment_consent()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.consent_status IS DISTINCT FROM OLD.consent_status THEN
    IF NEW.consent_status = 'granted' THEN
      NEW.consent_at := COALESCE(NEW.consent_at, now());
      NEW.revoked_at := NULL;
    ELSIF NEW.consent_status IN ('revoked', 'declined') THEN
      NEW.revoked_at := COALESCE(NULLIF(NEW.revoked_at, OLD.revoked_at), now());
    END IF;
  END IF;

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

REVOKE EXECUTE ON FUNCTION public.enforce_internal_assessment_consent() FROM PUBLIC, anon, authenticated;

-- 3) Bezpieczniejszy default roli
ALTER TABLE public.organization_members ALTER COLUMN role SET DEFAULT 'recruiter';

-- 4) Organizacja nie może zostać bez właściciela + brak zmiany właściciela
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
  SELECT o.owner_user_id INTO org_owner
    FROM public.organizations o
   WHERE o.id = COALESCE(NEW.organization_id, OLD.organization_id);

  IF TG_OP = 'DELETE' THEN
    -- Nigdy nie pozwól osierocić organizacji (nawet właścicielowi)
    IF OLD.user_id = org_owner OR OLD.role = 'owner' THEN
      RAISE EXCEPTION 'Nie można usunąć właściciela organizacji';
    END IF;
    RETURN OLD;
  END IF;

  -- Operacje serwisowe (bez kontekstu użytkownika) są dozwolone
  IF actor IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'owner' AND actor IS DISTINCT FROM org_owner THEN
      RAISE EXCEPTION 'Tylko właściciel organizacji może nadać rolę owner';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF actor IS DISTINCT FROM org_owner THEN
        RAISE EXCEPTION 'Tylko właściciel organizacji może zmieniać role';
      END IF;
      IF OLD.user_id = org_owner AND NEW.role IS DISTINCT FROM 'owner' THEN
        RAISE EXCEPTION 'Nie można zdegradować właściciela organizacji';
      END IF;
    END IF;
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Nie można przenosić członkostwa między organizacjami';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_org_owner_role() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.prevent_org_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
    RAISE EXCEPTION 'Nie można zmienić właściciela organizacji';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_org_owner_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_prevent_org_owner_change ON public.organizations;
CREATE TRIGGER trg_prevent_org_owner_change
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.prevent_org_owner_change();