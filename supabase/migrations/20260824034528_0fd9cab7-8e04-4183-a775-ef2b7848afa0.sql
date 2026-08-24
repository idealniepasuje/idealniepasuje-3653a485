CREATE POLICY "Employees can view their organization" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_employees e
      WHERE e.organization_id = organizations.id
        AND e.user_id = auth.uid()
        AND e.status IN ('invited','active')
    )
  );

CREATE POLICY "Assessed employees can view the offer" ON public.job_offers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.internal_assessments ia
      WHERE ia.job_offer_id = job_offers.id
        AND ia.employee_user_id = auth.uid()
    )
  );