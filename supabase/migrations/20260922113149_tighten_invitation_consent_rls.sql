-- Zgoda na analizę dotyczy konkretnej oferty i nie może być
-- tworzona bezpośrednio przez managera.

DROP POLICY IF EXISTS "Managers can request assessment"
ON public.internal_assessments;

REVOKE INSERT
ON public.internal_assessments
FROM authenticated;


-- Kandydat może zakończyć swoje połączenie z organizacją,
-- ale nie może samodzielnie ponownie ustawić statusu active.

DROP POLICY IF EXISTS "Employee can leave organization"
ON public.organization_employees;

CREATE POLICY "Employee can leave organization"
ON public.organization_employees
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
  AND status = 'removed'
);