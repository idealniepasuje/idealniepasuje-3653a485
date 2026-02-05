-- Add job_offer_id reference to match_results
ALTER TABLE public.match_results 
ADD COLUMN IF NOT EXISTS job_offer_id UUID REFERENCES public.job_offers(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_match_results_job_offer_id ON public.match_results(job_offer_id);

-- Add policy for candidates to view job offers through their matches
CREATE POLICY "Candidates can view matched job offers" 
ON public.job_offers FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM match_results 
  WHERE match_results.job_offer_id = job_offers.id 
  AND match_results.candidate_user_id = auth.uid()
));