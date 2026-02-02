-- Add LinkedIn URL column to employer_profiles
ALTER TABLE public.employer_profiles
ADD COLUMN linkedin_url text;