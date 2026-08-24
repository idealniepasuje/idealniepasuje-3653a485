-- 1) Consent follows active organization membership
CREATE OR REPLACE FUNCTION public.sync_internal_assessment_consent_membership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  is_active boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.organization_employees e
     WHERE e.organization_id = NEW.organization_id
       AND e.user_id = NEW.employee_user_id
       AND e.status = 'active'
  ) INTO is_active;

  IF is_active THEN
    NEW.consent_status := 'granted';
    NEW.consent_at := COALESCE(NEW.consent_at, now());
    NEW.revoked_at := NULL;
  ELSE
    NEW.consent_status := 'revoked';
    NEW.revoked_at := COALESCE(NEW.revoked_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_a_internal_assessment_membership ON public.internal_assessments;
CREATE TRIGGER trg_a_internal_assessment_membership
BEFORE INSERT OR UPDATE ON public.internal_assessments
FOR EACH ROW EXECUTE FUNCTION public.sync_internal_assessment_consent_membership();

-- 2) Membership changes propagate to assessments
CREATE OR REPLACE FUNCTION public.sync_assessments_on_membership_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.internal_assessments
       SET consent_status = 'granted'
     WHERE organization_id = NEW.organization_id
       AND employee_user_id = NEW.user_id
       AND consent_status IS DISTINCT FROM 'granted';
  ELSE
    UPDATE public.internal_assessments
       SET consent_status = 'revoked'
     WHERE organization_id = NEW.organization_id
       AND employee_user_id = NEW.user_id
       AND consent_status IS DISTINCT FROM 'revoked';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_assessments_membership ON public.organization_employees;
CREATE TRIGGER trg_sync_assessments_membership
AFTER INSERT OR UPDATE OF status ON public.organization_employees
FOR EACH ROW EXECUTE FUNCTION public.sync_assessments_on_membership_change();

-- 3) Safe backfill
UPDATE public.internal_assessments a
   SET consent_status = 'granted',
       consent_at = COALESCE(a.consent_at, now()),
       revoked_at = NULL
 WHERE a.consent_status IS DISTINCT FROM 'granted'
   AND EXISTS (
     SELECT 1 FROM public.organization_employees e
      WHERE e.organization_id = a.organization_id
        AND e.user_id = a.employee_user_id
        AND e.status = 'active'
   );

UPDATE public.internal_assessments a
   SET consent_status = 'revoked',
       revoked_at = COALESCE(a.revoked_at, now())
 WHERE a.consent_status IS DISTINCT FROM 'revoked'
   AND NOT EXISTS (
     SELECT 1 FROM public.organization_employees e
      WHERE e.organization_id = a.organization_id
        AND e.user_id = a.employee_user_id
        AND e.status = 'active'
   );