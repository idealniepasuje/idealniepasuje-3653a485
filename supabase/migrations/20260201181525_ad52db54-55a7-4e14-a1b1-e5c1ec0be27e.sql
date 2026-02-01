-- Add DELETE policy to match_results table to prevent any deletions
-- This preserves match history as an audit trail
CREATE POLICY "Match results cannot be deleted" 
ON public.match_results 
FOR DELETE 
USING (false);