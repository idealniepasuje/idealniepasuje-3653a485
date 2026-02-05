
-- Add explicit immutability policies for feedback tables
-- Candidate feedback immutability
CREATE POLICY "Candidate feedback cannot be updated"
ON public.candidate_feedback
FOR UPDATE
USING (false);

CREATE POLICY "Candidate feedback cannot be deleted"
ON public.candidate_feedback
FOR DELETE
USING (false);

-- Employer feedback immutability
CREATE POLICY "Employer feedback cannot be updated"
ON public.employer_feedback
FOR UPDATE
USING (false);

CREATE POLICY "Employer feedback cannot be deleted"
ON public.employer_feedback
FOR DELETE
USING (false);
