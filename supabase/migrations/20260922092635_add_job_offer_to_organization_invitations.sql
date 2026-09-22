-- Powiązanie zaproszenia kandydata z konkretną ofertą.
-- Stare zaproszenia pozostają bez job_offer_id, żeby nie uszkodzić istniejących danych.

ALTER TABLE public.organization_invitations
  ADD COLUMN IF NOT EXISTS job_offer_id uuid
  REFERENCES public.job_offers(id)
  ON DELETE CASCADE;

DROP INDEX IF EXISTS public.organization_invitations_pending_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS organization_invitations_pending_offer_uniq
  ON public.organization_invitations (
    organization_id,
    job_offer_id,
    lower(email)
  )
  WHERE status = 'pending'
    AND job_offer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS organization_invitations_job_offer_id_idx
  ON public.organization_invitations (job_offer_id);