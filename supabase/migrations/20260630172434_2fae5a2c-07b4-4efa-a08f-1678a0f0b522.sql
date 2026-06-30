
CREATE OR REPLACE FUNCTION public.sync_tools_request_status_on_candidate_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_count int := 0;
  new_count int := 0;
BEGIN
  IF OLD.tools IS NOT NULL THEN
    old_count := jsonb_array_length(OLD.tools);
  END IF;
  IF NEW.tools IS NOT NULL THEN
    new_count := jsonb_array_length(NEW.tools);
  END IF;

  IF new_count > 0 AND old_count = 0 THEN
    UPDATE public.match_results
       SET tools_request_status = 'completed'
     WHERE candidate_user_id = NEW.user_id
       AND tools_request_status IN ('sent_auto','awaiting');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tools_request_status ON public.candidate_test_results;
CREATE TRIGGER trg_sync_tools_request_status
AFTER UPDATE OF tools ON public.candidate_test_results
FOR EACH ROW
EXECUTE FUNCTION public.sync_tools_request_status_on_candidate_update();
