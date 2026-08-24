-- ============ ORGANIZATIONS ============
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner','admin','recruiter')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m
                 WHERE m.organization_id = _org AND m.user_id = _user)
$$;

CREATE OR REPLACE FUNCTION public.is_org_manager(_org uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m
                 WHERE m.organization_id = _org AND m.user_id = _user
                   AND m.role IN ('owner','admin'))
$$;

CREATE POLICY "Members can view their organizations" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(id, auth.uid()) OR owner_user_id = auth.uid());
CREATE POLICY "Employers can create organizations" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid() AND public.get_user_type(auth.uid()) = 'employer');
CREATE POLICY "Managers can update their organization" ON public.organizations
  FOR UPDATE TO authenticated USING (public.is_org_manager(id, auth.uid())) WITH CHECK (public.is_org_manager(id, auth.uid()));

CREATE POLICY "Members can view org members" ON public.organization_members
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "Managers can add members" ON public.organization_members
  FOR INSERT TO authenticated WITH CHECK (
    public.is_org_manager(organization_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_user_id = auth.uid())
  );
CREATE POLICY "Managers can update members" ON public.organization_members
  FOR UPDATE TO authenticated USING (public.is_org_manager(organization_id, auth.uid())) WITH CHECK (public.is_org_manager(organization_id, auth.uid()));
CREATE POLICY "Managers can remove members" ON public.organization_members
  FOR DELETE TO authenticated USING (public.is_org_manager(organization_id, auth.uid()));

-- ============ EMPLOYEES ============
CREATE TABLE public.organization_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  invited_email text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited','active','removed')),
  joined_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, UPDATE ON public.organization_employees TO authenticated;
GRANT ALL ON public.organization_employees TO service_role;
ALTER TABLE public.organization_employees ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_active_org_employee(_org uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_employees e
                 WHERE e.organization_id = _org AND e.user_id = _user AND e.status = 'active')
$$;

CREATE POLICY "Org members and the employee can view membership" ON public.organization_employees
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "Managers can update employee membership" ON public.organization_employees
  FOR UPDATE TO authenticated USING (public.is_org_manager(organization_id, auth.uid())) WITH CHECK (public.is_org_manager(organization_id, auth.uid()));
CREATE POLICY "Employee can leave organization" ON public.organization_employees
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_organization_employees_updated_at BEFORE UPDATE ON public.organization_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INVITATIONS ============
CREATE TABLE public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','revoked','expired')),
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX organization_invitations_pending_uniq
  ON public.organization_invitations (organization_id, lower(email)) WHERE status = 'pending';
GRANT SELECT, UPDATE ON public.organization_invitations TO authenticated;
GRANT ALL ON public.organization_invitations TO service_role;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view invitations" ON public.organization_invitations
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "Invited user can view own invitation" ON public.organization_invitations
  FOR SELECT TO authenticated USING (lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), '')));
CREATE POLICY "Managers can revoke invitations" ON public.organization_invitations
  FOR UPDATE TO authenticated USING (public.is_org_manager(organization_id, auth.uid())) WITH CHECK (public.is_org_manager(organization_id, auth.uid()));

CREATE TRIGGER update_organization_invitations_updated_at BEFORE UPDATE ON public.organization_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ JOB OFFERS: modes + organization ============
ALTER TABLE public.job_offers
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN analyze_internal_team boolean NOT NULL DEFAULT false,
  ADD COLUMN recruit_external_candidates boolean NOT NULL DEFAULT true;
ALTER TABLE public.job_offers
  ADD CONSTRAINT job_offers_at_least_one_mode CHECK (analyze_internal_team OR recruit_external_candidates);

-- ============ CANDIDATE: external market opt-in ============
ALTER TABLE public.candidate_test_results
  ADD COLUMN open_to_external_offers boolean NOT NULL DEFAULT true;

-- ============ INTERNAL ASSESSMENTS ============
CREATE TABLE public.internal_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_offer_id uuid NOT NULL REFERENCES public.job_offers(id) ON DELETE CASCADE,
  employee_user_id uuid NOT NULL,
  requested_by uuid,
  consent_status text NOT NULL DEFAULT 'pending' CHECK (consent_status IN ('pending','granted','declined','revoked')),
  consent_at timestamptz,
  revoked_at timestamptz,
  overall_percent integer,
  competence_percent integer,
  culture_percent integer,
  extra_percent integer,
  match_details jsonb,
  computed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_offer_id, employee_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_assessments TO authenticated;
GRANT ALL ON public.internal_assessments TO service_role;
ALTER TABLE public.internal_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members and employee can view assessments" ON public.internal_assessments
  FOR SELECT TO authenticated USING (employee_user_id = auth.uid() OR public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "Managers can request assessment" ON public.internal_assessments
  FOR INSERT TO authenticated WITH CHECK (
    public.is_org_manager(organization_id, auth.uid())
    AND public.is_active_org_employee(organization_id, employee_user_id)
    AND EXISTS (SELECT 1 FROM public.job_offers o WHERE o.id = job_offer_id AND o.organization_id = internal_assessments.organization_id AND o.analyze_internal_team)
  );
CREATE POLICY "Managers can remove assessment" ON public.internal_assessments
  FOR DELETE TO authenticated USING (public.is_org_manager(organization_id, auth.uid()));
CREATE POLICY "Employee manages own consent" ON public.internal_assessments
  FOR UPDATE TO authenticated USING (employee_user_id = auth.uid()) WITH CHECK (employee_user_id = auth.uid());

REVOKE UPDATE ON public.internal_assessments FROM authenticated;
GRANT UPDATE (consent_status, consent_at, revoked_at, updated_at) ON public.internal_assessments TO authenticated;

CREATE TRIGGER update_internal_assessments_updated_at BEFORE UPDATE ON public.internal_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Company can read employee test results only with granted consent + active membership
CREATE POLICY "Org can view consenting employee results" ON public.candidate_test_results
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.internal_assessments ia
      WHERE ia.employee_user_id = candidate_test_results.user_id
        AND ia.consent_status = 'granted'
        AND public.is_org_member(ia.organization_id, auth.uid())
        AND public.is_active_org_employee(ia.organization_id, ia.employee_user_id)
    )
  );

-- ============ BACKFILL: one organization per existing employer ============
INSERT INTO public.organizations (name, owner_user_id)
SELECT COALESCE(NULLIF(TRIM(ep.company_name), ''), 'Moja firma'), ep.user_id
FROM public.employer_profiles ep;

INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT o.id, o.owner_user_id, 'owner' FROM public.organizations o
ON CONFLICT DO NOTHING;

UPDATE public.job_offers jo
SET organization_id = o.id
FROM public.organizations o
WHERE o.owner_user_id = jo.user_id AND jo.organization_id IS NULL;