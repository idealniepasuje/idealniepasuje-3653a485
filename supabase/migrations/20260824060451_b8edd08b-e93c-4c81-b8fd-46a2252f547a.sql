CREATE OR REPLACE FUNCTION public.block_external_messages_when_closed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open boolean;
  v_internal boolean;
BEGIN
  SELECT open_to_external_offers INTO v_open
  FROM public.candidate_test_results
  WHERE user_id = NEW.candidate_user_id;

  IF v_open IS DISTINCT FROM false THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.organization_employees oe
    JOIN public.organization_members om ON om.organization_id = oe.organization_id
    WHERE oe.user_id = NEW.candidate_user_id
      AND oe.status = 'active'
      AND om.user_id = NEW.employer_user_id
      AND om.role IN ('owner', 'admin', 'recruiter')
  ) INTO v_internal;

  IF v_internal THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Kandydat nie przyjmuje obecnie nowych propozycji od pracodawców.'
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_block_external_messages_when_closed ON public.candidate_messages;
CREATE TRIGGER trg_block_external_messages_when_closed
BEFORE INSERT ON public.candidate_messages
FOR EACH ROW EXECUTE FUNCTION public.block_external_messages_when_closed();

REVOKE ALL ON FUNCTION public.block_external_messages_when_closed() FROM PUBLIC, anon, authenticated;