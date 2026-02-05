-- First add columns to match_results (before creating job_offers)
ALTER TABLE public.match_results 
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE;

-- Create the job_offers table for multi-position support
CREATE TABLE public.job_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  role_description TEXT,
  role_responsibilities TEXT,
  industry TEXT,
  required_experience TEXT,
  position_level TEXT,
  no_experience_required BOOLEAN DEFAULT false,
  accepted_industries TEXT[] DEFAULT NULL,
  accepted_industry_requirements JSONB DEFAULT '[]'::jsonb,
  req_komunikacja NUMERIC,
  req_myslenie_analityczne NUMERIC,
  req_out_of_the_box NUMERIC,
  req_determinacja NUMERIC,
  req_adaptacja NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on job_offers
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_offers (without referencing match_results.job_offer_id yet)
CREATE POLICY "Employers can view own job offers" 
ON public.job_offers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Employers can insert own job offers" 
ON public.job_offers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employers can update own job offers" 
ON public.job_offers FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Employers can delete own job offers" 
ON public.job_offers FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to job_offers" 
ON public.job_offers FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create trigger for updating job_offers updated_at
CREATE TRIGGER update_job_offers_updated_at
BEFORE UPDATE ON public.job_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_job_offers_user_id ON public.job_offers(user_id);