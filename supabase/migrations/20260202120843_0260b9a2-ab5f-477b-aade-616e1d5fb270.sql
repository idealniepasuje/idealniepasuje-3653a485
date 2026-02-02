-- Create feedback table for candidate survey responses
CREATE TABLE public.candidate_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  likes_solution TEXT NOT NULL,
  likes_reason TEXT,
  would_change TEXT NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidate_feedback ENABLE ROW LEVEL SECURITY;

-- Candidates can insert their own feedback
CREATE POLICY "Candidates can insert own feedback"
ON public.candidate_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Candidates can view their own feedback
CREATE POLICY "Candidates can view own feedback"
ON public.candidate_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to candidate_feedback"
ON public.candidate_feedback
FOR SELECT
USING (auth.uid() IS NOT NULL);