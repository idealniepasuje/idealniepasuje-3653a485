
-- Add culture data columns to job_offers table
ALTER TABLE job_offers 
  ADD COLUMN IF NOT EXISTS culture_answers jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS culture_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS culture_relacja_wspolpraca numeric,
  ADD COLUMN IF NOT EXISTS culture_elastycznosc_innowacyjnosc numeric,
  ADD COLUMN IF NOT EXISTS culture_wyniki_cele numeric,
  ADD COLUMN IF NOT EXISTS culture_stabilnosc_struktura numeric,
  ADD COLUMN IF NOT EXISTS culture_autonomia_styl_pracy numeric,
  ADD COLUMN IF NOT EXISTS culture_wlb_dobrostan numeric;
