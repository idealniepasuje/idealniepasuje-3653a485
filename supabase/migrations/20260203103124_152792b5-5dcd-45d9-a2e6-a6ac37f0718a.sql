-- Add column for storing detailed accepted industry requirements (with years and position level)
ALTER TABLE public.employer_profiles 
ADD COLUMN IF NOT EXISTS accepted_industry_requirements jsonb DEFAULT '[]'::jsonb;