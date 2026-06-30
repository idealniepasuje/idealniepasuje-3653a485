
ALTER TABLE public.candidate_test_results
  ADD COLUMN IF NOT EXISTS tools jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.job_offers
  ADD COLUMN IF NOT EXISTS required_tools jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.match_results
  ADD COLUMN IF NOT EXISTS tools_request_status text NOT NULL DEFAULT 'not_sent'
  CHECK (tools_request_status IN ('not_sent','sent_auto','awaiting','completed','no_response'));

-- Validation function: every entry must have valid tool level
CREATE OR REPLACE FUNCTION public.validate_tools_jsonb()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  arr jsonb;
  item jsonb;
BEGIN
  IF TG_TABLE_NAME = 'candidate_test_results' THEN
    arr := COALESCE(NEW.tools, '[]'::jsonb);
  ELSIF TG_TABLE_NAME = 'job_offers' THEN
    arr := COALESCE(NEW.required_tools, '[]'::jsonb);
  ELSE
    RETURN NEW;
  END IF;

  IF jsonb_typeof(arr) <> 'array' THEN
    RAISE EXCEPTION 'tools must be a JSON array';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(arr) LOOP
    IF NOT (item ? 'tool_id') OR NOT (item ? 'level') THEN
      RAISE EXCEPTION 'each tool entry must contain tool_id and level';
    END IF;
    IF (item->>'level') NOT IN ('basic','intermediate','advanced','expert') THEN
      RAISE EXCEPTION 'invalid tool level: %', item->>'level';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_candidate_tools ON public.candidate_test_results;
CREATE TRIGGER validate_candidate_tools
  BEFORE INSERT OR UPDATE OF tools ON public.candidate_test_results
  FOR EACH ROW EXECUTE FUNCTION public.validate_tools_jsonb();

DROP TRIGGER IF EXISTS validate_offer_tools ON public.job_offers;
CREATE TRIGGER validate_offer_tools
  BEFORE INSERT OR UPDATE OF required_tools ON public.job_offers
  FOR EACH ROW EXECUTE FUNCTION public.validate_tools_jsonb();

-- Auto-complete tools_request_status when candidate fills tools
CREATE OR REPLACE FUNCTION public.complete_tools_request_on_fill()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF jsonb_typeof(COALESCE(NEW.tools, '[]'::jsonb)) = 'array'
     AND jsonb_array_length(COALESCE(NEW.tools, '[]'::jsonb)) > 0 THEN
    UPDATE public.match_results
       SET tools_request_status = 'completed'
     WHERE candidate_user_id = NEW.user_id
       AND tools_request_status IN ('sent_auto','awaiting');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_complete_tools_request ON public.candidate_test_results;
CREATE TRIGGER auto_complete_tools_request
  AFTER INSERT OR UPDATE OF tools ON public.candidate_test_results
  FOR EACH ROW EXECUTE FUNCTION public.complete_tools_request_on_fill();
