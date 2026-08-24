-- 1. Archive marker for organizations without a living owner
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 2. Prevent future orphan membership rows
-- allow removing membership rows whose auth account no longer exists (account deletion cascade)
CREATE OR REPLACE FUNCTION public.enforce_org_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org_owner uuid;
  actor uuid := auth.uid();
BEGIN
  SELECT o.owner_user_id INTO org_owner
    FROM public.organizations o
   WHERE o.id = COALESCE(NEW.organization_id, OLD.organization_id);

  IF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = OLD.user_id) THEN
      RETURN OLD;
    END IF;
    IF OLD.user_id = org_owner OR OLD.role = 'owner' THEN
      RAISE EXCEPTION 'Nie można usunąć właściciela organizacji';
    END IF;
    RETURN OLD;
  END IF;

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
$function$;

DELETE FROM public.organization_members m
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = m.user_id);

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Deterministic owner-deletion cleanup
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org RECORD;
  successor uuid;
BEGIN
  -- Organizations owned by the deleted user: transfer or archive (never destroy history)
  FOR org IN SELECT id FROM public.organizations WHERE owner_user_id = OLD.id LOOP
    SELECT m.user_id INTO successor
    FROM public.organization_members m
    WHERE m.organization_id = org.id
      AND m.user_id <> OLD.id
      AND m.role IN ('owner', 'admin')
      AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = m.user_id)
    ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END, m.created_at
    LIMIT 1;

    IF successor IS NOT NULL THEN
      UPDATE public.organizations SET owner_user_id = successor, updated_at = now() WHERE id = org.id;
      UPDATE public.organization_members SET role = 'owner' WHERE organization_id = org.id AND user_id = successor;
      -- keep offers and their matches alive under the new owner
      UPDATE public.job_offers SET user_id = successor, updated_at = now()
      WHERE organization_id = org.id AND user_id = OLD.id;
    ELSE
      UPDATE public.organizations SET archived_at = now(), updated_at = now()
      WHERE id = org.id AND archived_at IS NULL;
      -- preserve history but make sure nothing stays live / matchable
      UPDATE public.job_offers SET is_active = false, updated_at = now()
      WHERE organization_id = org.id AND user_id = OLD.id AND is_active;
    END IF;

    -- employee records stay as history, marked as removed
    UPDATE public.organization_employees
    SET status = 'removed', removed_at = COALESCE(removed_at, now()), updated_at = now()
    WHERE organization_id = org.id AND user_id = OLD.id AND status <> 'removed';
  END LOOP;

  -- the deleted user's own employee memberships in other organizations
  UPDATE public.organization_employees
  SET status = 'removed', removed_at = COALESCE(removed_at, now()), updated_at = now()
  WHERE user_id = OLD.id AND status <> 'removed';

  DELETE FROM public.audit_log WHERE user_id = OLD.id;
  DELETE FROM public.match_results WHERE candidate_user_id = OLD.id OR employer_user_id = OLD.id;
  DELETE FROM public.candidate_feedback WHERE user_id = OLD.id;
  DELETE FROM public.employer_feedback WHERE user_id = OLD.id;
  -- only personal (non-organization) offers are removed; org offers were handled above
  DELETE FROM public.job_offers WHERE user_id = OLD.id AND organization_id IS NULL;
  DELETE FROM public.candidate_test_results WHERE user_id = OLD.id;
  DELETE FROM public.employer_profiles WHERE user_id = OLD.id;
  DELETE FROM public.profiles WHERE user_id = OLD.id;
  RETURN OLD;
END;
$function$;

-- 4. One-off repair of the existing orphan organization (no successor exists)
UPDATE public.organizations o
SET archived_at = now(), updated_at = now()
WHERE archived_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = o.owner_user_id);

UPDATE public.job_offers j
SET is_active = false, updated_at = now()
WHERE j.is_active
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = j.user_id);

INSERT INTO public._audit_repair_log (run_at, action, user_id, payload)
SELECT now(), 'archive_orphan_organizations', NULL,
  jsonb_build_object('organizations', (SELECT jsonb_agg(id) FROM public.organizations WHERE archived_at IS NOT NULL));