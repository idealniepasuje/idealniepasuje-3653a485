-- Add new columns for multiple industry experiences (candidate)
ALTER TABLE public.candidate_test_results 
ADD COLUMN IF NOT EXISTS industry_experiences jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS has_no_experience boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS target_industries text[] DEFAULT '{}';

-- Add new columns for employer requirements
ALTER TABLE public.employer_profiles
ADD COLUMN IF NOT EXISTS no_experience_required boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.candidate_test_results.industry_experiences IS 'Array of {industry, years, positionLevel} objects - max 3';
COMMENT ON COLUMN public.candidate_test_results.has_no_experience IS 'True if candidate has no work experience';
COMMENT ON COLUMN public.candidate_test_results.target_industries IS 'Industries candidate wants to work in if changing - max 3';
COMMENT ON COLUMN public.employer_profiles.no_experience_required IS 'True if position does not require prior experience';