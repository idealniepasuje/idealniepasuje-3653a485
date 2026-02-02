-- Create employer feedback table
CREATE TABLE public.employer_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  likes_solution TEXT NOT NULL,
  likes_reason TEXT,
  would_change TEXT NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employer_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for employer access
CREATE POLICY "Employers can insert own feedback"
ON public.employer_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employers can view own feedback"
ON public.employer_feedback
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to employer_feedback"
ON public.employer_feedback
FOR SELECT
USING (auth.uid() IS NOT NULL);