-- Fix 1: Add explicit DELETE policy for candidate_test_results (deny all deletions)
-- This makes the security posture explicit
CREATE POLICY "Candidates cannot delete test results"
ON public.candidate_test_results
FOR DELETE
USING (false);

-- Fix 2: Add explicit DELETE policy for employer_profiles (deny all deletions)
CREATE POLICY "Employers cannot delete profiles"
ON public.employer_profiles
FOR DELETE
USING (false);

-- Fix 3: Add text length constraints using validation triggers (not CHECK constraints to avoid immutability issues)
-- Note: Using triggers instead of CHECK constraints for better flexibility

-- Create a validation function for text length limits
CREATE OR REPLACE FUNCTION public.validate_text_lengths()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Check work_description length for candidate_test_results
  IF TG_TABLE_NAME = 'candidate_test_results' THEN
    IF NEW.work_description IS NOT NULL AND length(NEW.work_description) > 2000 THEN
      RAISE EXCEPTION 'work_description exceeds maximum length of 2000 characters';
    END IF;
  END IF;
  
  -- Check role_description and role_responsibilities length for employer_profiles
  IF TG_TABLE_NAME = 'employer_profiles' THEN
    IF NEW.role_description IS NOT NULL AND length(NEW.role_description) > 1000 THEN
      RAISE EXCEPTION 'role_description exceeds maximum length of 1000 characters';
    END IF;
    IF NEW.role_responsibilities IS NOT NULL AND length(NEW.role_responsibilities) > 2000 THEN
      RAISE EXCEPTION 'role_responsibilities exceeds maximum length of 2000 characters';
    END IF;
    IF NEW.company_name IS NOT NULL AND length(NEW.company_name) > 200 THEN
      RAISE EXCEPTION 'company_name exceeds maximum length of 200 characters';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for text length validation
CREATE TRIGGER validate_candidate_text_lengths
BEFORE INSERT OR UPDATE ON public.candidate_test_results
FOR EACH ROW
EXECUTE FUNCTION public.validate_text_lengths();

CREATE TRIGGER validate_employer_text_lengths
BEFORE INSERT OR UPDATE ON public.employer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_text_lengths();

-- Fix 4: Add score range validation triggers
CREATE OR REPLACE FUNCTION public.validate_score_ranges()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate competency scores (1-5 range)
  IF TG_TABLE_NAME = 'candidate_test_results' THEN
    IF NEW.komunikacja_score IS NOT NULL AND (NEW.komunikacja_score < 1 OR NEW.komunikacja_score > 5) THEN
      RAISE EXCEPTION 'komunikacja_score must be between 1 and 5';
    END IF;
    IF NEW.myslenie_analityczne_score IS NOT NULL AND (NEW.myslenie_analityczne_score < 1 OR NEW.myslenie_analityczne_score > 5) THEN
      RAISE EXCEPTION 'myslenie_analityczne_score must be between 1 and 5';
    END IF;
    IF NEW.out_of_the_box_score IS NOT NULL AND (NEW.out_of_the_box_score < 1 OR NEW.out_of_the_box_score > 5) THEN
      RAISE EXCEPTION 'out_of_the_box_score must be between 1 and 5';
    END IF;
    IF NEW.determinacja_score IS NOT NULL AND (NEW.determinacja_score < 1 OR NEW.determinacja_score > 5) THEN
      RAISE EXCEPTION 'determinacja_score must be between 1 and 5';
    END IF;
    IF NEW.adaptacja_score IS NOT NULL AND (NEW.adaptacja_score < 1 OR NEW.adaptacja_score > 5) THEN
      RAISE EXCEPTION 'adaptacja_score must be between 1 and 5';
    END IF;
    
    -- Validate culture scores (1-5 range)
    IF NEW.culture_relacja_wspolpraca IS NOT NULL AND (NEW.culture_relacja_wspolpraca < 1 OR NEW.culture_relacja_wspolpraca > 5) THEN
      RAISE EXCEPTION 'culture_relacja_wspolpraca must be between 1 and 5';
    END IF;
    IF NEW.culture_elastycznosc_innowacyjnosc IS NOT NULL AND (NEW.culture_elastycznosc_innowacyjnosc < 1 OR NEW.culture_elastycznosc_innowacyjnosc > 5) THEN
      RAISE EXCEPTION 'culture_elastycznosc_innowacyjnosc must be between 1 and 5';
    END IF;
    IF NEW.culture_wyniki_cele IS NOT NULL AND (NEW.culture_wyniki_cele < 1 OR NEW.culture_wyniki_cele > 5) THEN
      RAISE EXCEPTION 'culture_wyniki_cele must be between 1 and 5';
    END IF;
    IF NEW.culture_stabilnosc_struktura IS NOT NULL AND (NEW.culture_stabilnosc_struktura < 1 OR NEW.culture_stabilnosc_struktura > 5) THEN
      RAISE EXCEPTION 'culture_stabilnosc_struktura must be between 1 and 5';
    END IF;
    IF NEW.culture_autonomia_styl_pracy IS NOT NULL AND (NEW.culture_autonomia_styl_pracy < 1 OR NEW.culture_autonomia_styl_pracy > 5) THEN
      RAISE EXCEPTION 'culture_autonomia_styl_pracy must be between 1 and 5';
    END IF;
    IF NEW.culture_wlb_dobrostan IS NOT NULL AND (NEW.culture_wlb_dobrostan < 1 OR NEW.culture_wlb_dobrostan > 5) THEN
      RAISE EXCEPTION 'culture_wlb_dobrostan must be between 1 and 5';
    END IF;
  END IF;
  
  -- Validate employer culture scores
  IF TG_TABLE_NAME = 'employer_profiles' THEN
    IF NEW.culture_relacja_wspolpraca IS NOT NULL AND (NEW.culture_relacja_wspolpraca < 1 OR NEW.culture_relacja_wspolpraca > 5) THEN
      RAISE EXCEPTION 'culture_relacja_wspolpraca must be between 1 and 5';
    END IF;
    IF NEW.culture_elastycznosc_innowacyjnosc IS NOT NULL AND (NEW.culture_elastycznosc_innowacyjnosc < 1 OR NEW.culture_elastycznosc_innowacyjnosc > 5) THEN
      RAISE EXCEPTION 'culture_elastycznosc_innowacyjnosc must be between 1 and 5';
    END IF;
    IF NEW.culture_wyniki_cele IS NOT NULL AND (NEW.culture_wyniki_cele < 1 OR NEW.culture_wyniki_cele > 5) THEN
      RAISE EXCEPTION 'culture_wyniki_cele must be between 1 and 5';
    END IF;
    IF NEW.culture_stabilnosc_struktura IS NOT NULL AND (NEW.culture_stabilnosc_struktura < 1 OR NEW.culture_stabilnosc_struktura > 5) THEN
      RAISE EXCEPTION 'culture_stabilnosc_struktura must be between 1 and 5';
    END IF;
    IF NEW.culture_autonomia_styl_pracy IS NOT NULL AND (NEW.culture_autonomia_styl_pracy < 1 OR NEW.culture_autonomia_styl_pracy > 5) THEN
      RAISE EXCEPTION 'culture_autonomia_styl_pracy must be between 1 and 5';
    END IF;
    IF NEW.culture_wlb_dobrostan IS NOT NULL AND (NEW.culture_wlb_dobrostan < 1 OR NEW.culture_wlb_dobrostan > 5) THEN
      RAISE EXCEPTION 'culture_wlb_dobrostan must be between 1 and 5';
    END IF;
    
    -- Validate requirement scores (1-5 range)
    IF NEW.req_komunikacja IS NOT NULL AND (NEW.req_komunikacja < 1 OR NEW.req_komunikacja > 5) THEN
      RAISE EXCEPTION 'req_komunikacja must be between 1 and 5';
    END IF;
    IF NEW.req_myslenie_analityczne IS NOT NULL AND (NEW.req_myslenie_analityczne < 1 OR NEW.req_myslenie_analityczne > 5) THEN
      RAISE EXCEPTION 'req_myslenie_analityczne must be between 1 and 5';
    END IF;
    IF NEW.req_out_of_the_box IS NOT NULL AND (NEW.req_out_of_the_box < 1 OR NEW.req_out_of_the_box > 5) THEN
      RAISE EXCEPTION 'req_out_of_the_box must be between 1 and 5';
    END IF;
    IF NEW.req_determinacja IS NOT NULL AND (NEW.req_determinacja < 1 OR NEW.req_determinacja > 5) THEN
      RAISE EXCEPTION 'req_determinacja must be between 1 and 5';
    END IF;
    IF NEW.req_adaptacja IS NOT NULL AND (NEW.req_adaptacja < 1 OR NEW.req_adaptacja > 5) THEN
      RAISE EXCEPTION 'req_adaptacja must be between 1 and 5';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for score range validation
CREATE TRIGGER validate_candidate_score_ranges
BEFORE INSERT OR UPDATE ON public.candidate_test_results
FOR EACH ROW
EXECUTE FUNCTION public.validate_score_ranges();

CREATE TRIGGER validate_employer_score_ranges
BEFORE INSERT OR UPDATE ON public.employer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_score_ranges();