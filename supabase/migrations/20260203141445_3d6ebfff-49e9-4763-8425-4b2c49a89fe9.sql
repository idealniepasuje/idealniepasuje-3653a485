-- Change employer competency requirement columns from INTEGER to NUMERIC to support 0.1 step values
ALTER TABLE public.employer_profiles 
  ALTER COLUMN req_komunikacja TYPE NUMERIC(3,1),
  ALTER COLUMN req_myslenie_analityczne TYPE NUMERIC(3,1),
  ALTER COLUMN req_out_of_the_box TYPE NUMERIC(3,1),
  ALTER COLUMN req_determinacja TYPE NUMERIC(3,1),
  ALTER COLUMN req_adaptacja TYPE NUMERIC(3,1);

-- Drop old CHECK constraints (they still work with NUMERIC)
ALTER TABLE public.employer_profiles DROP CONSTRAINT IF EXISTS employer_profiles_req_komunikacja_check;
ALTER TABLE public.employer_profiles DROP CONSTRAINT IF EXISTS employer_profiles_req_myslenie_analityczne_check;
ALTER TABLE public.employer_profiles DROP CONSTRAINT IF EXISTS employer_profiles_req_out_of_the_box_check;
ALTER TABLE public.employer_profiles DROP CONSTRAINT IF EXISTS employer_profiles_req_determinacja_check;
ALTER TABLE public.employer_profiles DROP CONSTRAINT IF EXISTS employer_profiles_req_adaptacja_check;

-- Add new CHECK constraints for NUMERIC values (1.0 to 5.0)
ALTER TABLE public.employer_profiles 
  ADD CONSTRAINT employer_profiles_req_komunikacja_check CHECK (req_komunikacja >= 1.0 AND req_komunikacja <= 5.0),
  ADD CONSTRAINT employer_profiles_req_myslenie_analityczne_check CHECK (req_myslenie_analityczne >= 1.0 AND req_myslenie_analityczne <= 5.0),
  ADD CONSTRAINT employer_profiles_req_out_of_the_box_check CHECK (req_out_of_the_box >= 1.0 AND req_out_of_the_box <= 5.0),
  ADD CONSTRAINT employer_profiles_req_determinacja_check CHECK (req_determinacja >= 1.0 AND req_determinacja <= 5.0),
  ADD CONSTRAINT employer_profiles_req_adaptacja_check CHECK (req_adaptacja >= 1.0 AND req_adaptacja <= 5.0);