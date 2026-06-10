
ALTER TABLE public.job_offers
  ADD COLUMN IF NOT EXISTS lang_spanish TEXT,
  ADD COLUMN IF NOT EXISTS lang_german TEXT,
  ADD COLUMN IF NOT EXISTS lang_polish TEXT;

DO $$ BEGIN
  ALTER TABLE public.job_offers
    ADD CONSTRAINT job_offers_lang_spanish_chk CHECK (lang_spanish IS NULL OR lang_spanish IN ('none','A1','A2','B1','B2','C1','C2','native'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.job_offers
    ADD CONSTRAINT job_offers_lang_german_chk CHECK (lang_german IS NULL OR lang_german IN ('none','A1','A2','B1','B2','C1','C2','native'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.job_offers
    ADD CONSTRAINT job_offers_lang_polish_chk CHECK (lang_polish IS NULL OR lang_polish IN ('none','A1','A2','B1','B2','C1','C2','native'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
