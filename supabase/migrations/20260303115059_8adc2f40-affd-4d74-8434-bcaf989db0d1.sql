
-- Add work_mode and city to candidate_test_results
ALTER TABLE public.candidate_test_results
  ADD COLUMN IF NOT EXISTS work_mode text,
  ADD COLUMN IF NOT EXISTS city text;

-- Add work_mode, city, and company_name to job_offers
ALTER TABLE public.job_offers
  ADD COLUMN IF NOT EXISTS work_mode text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS company_name text;

-- Add feedback_modal_dismissed_at to profiles for cooldown tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS feedback_modal_dismissed_at timestamp with time zone;
