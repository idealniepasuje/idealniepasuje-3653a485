
-- ============================================================
-- Audyt naprawczy: P1 + P2 + P3 + redundant UNIQUE + orphan
-- Bezpieczne. Nie usuwa żadnego rekordu z realnymi wynikami.
-- ============================================================

-- Tabela archiwum (raz, idempotentnie)
CREATE TABLE IF NOT EXISTS public._audit_repair_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  action text NOT NULL,
  user_id uuid,
  payload jsonb
);
GRANT ALL ON public._audit_repair_log TO service_role;

-- 1. Snapshot kandydatów P1 (atc=true ale brak score'ów) PRZED zmianą
WITH p1 AS (
  SELECT user_id, row_to_json(c)::jsonb AS payload
  FROM public.candidate_test_results c
  WHERE all_tests_completed = true
    AND (komunikacja_score IS NULL
      OR myslenie_analityczne_score IS NULL
      OR out_of_the_box_score IS NULL
      OR determinacja_score IS NULL
      OR adaptacja_score IS NULL
      OR culture_relacja_wspolpraca IS NULL)
)
INSERT INTO public._audit_repair_log (action, user_id, payload)
SELECT 'P1_snapshot_before_atc_reset', user_id, payload FROM p1;

-- 1a. Cofnij flagę
UPDATE public.candidate_test_results
SET all_tests_completed = false
WHERE all_tests_completed = true
  AND (komunikacja_score IS NULL
    OR myslenie_analityczne_score IS NULL
    OR out_of_the_box_score IS NULL
    OR determinacja_score IS NULL
    OR adaptacja_score IS NULL
    OR culture_relacja_wspolpraca IS NULL);

-- 1b. Archiwizuj match_results tych kandydatów PRZED usunięciem
INSERT INTO public._audit_repair_log (action, user_id, payload)
SELECT 'P1_match_results_deleted', m.candidate_user_id, row_to_json(m)::jsonb
FROM public.match_results m
WHERE m.candidate_user_id IN (
  SELECT user_id FROM public._audit_repair_log
  WHERE action = 'P1_snapshot_before_atc_reset'
);

-- 1c. Usuń match_results dla naprawionych kandydatów
DELETE FROM public.match_results
WHERE candidate_user_id IN (
  SELECT user_id FROM public._audit_repair_log
  WHERE action = 'P1_snapshot_before_atc_reset'
);

-- 2. Drop redundantny UNIQUE
ALTER TABLE public.employer_profiles
  DROP CONSTRAINT IF EXISTS employer_profiles_user_id_unique;

-- 3. Usuń CZYSTY osierocony rekord (z weryfikacją warunków bezpieczeństwa)
INSERT INTO public._audit_repair_log (action, user_id, payload)
SELECT 'orphan_274961a1_deleted', user_id, row_to_json(c)::jsonb
FROM public.candidate_test_results c
WHERE c.user_id = '274961a1-c473-4fda-98e0-e7a9c6e3958a'
  AND c.komunikacja_score IS NULL
  AND c.myslenie_analityczne_score IS NULL
  AND c.out_of_the_box_score IS NULL
  AND c.determinacja_score IS NULL
  AND c.adaptacja_score IS NULL
  AND c.culture_test_completed = false
  AND (c.getting_to_know IS NULL OR c.getting_to_know = '{}'::jsonb)
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = c.user_id);

DELETE FROM public.candidate_test_results c
WHERE c.user_id = '274961a1-c473-4fda-98e0-e7a9c6e3958a'
  AND c.komunikacja_score IS NULL
  AND c.myslenie_analityczne_score IS NULL
  AND c.out_of_the_box_score IS NULL
  AND c.determinacja_score IS NULL
  AND c.adaptacja_score IS NULL
  AND c.culture_test_completed = false
  AND (c.getting_to_know IS NULL OR c.getting_to_know = '{}'::jsonb)
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = c.user_id);

-- 4. Dla 5ada845a — odtwórz profile JEŚLI istnieje w auth.users
--    (migracja działa z uprawnieniami superusera, więc ma dostęp do auth)
DO $$
DECLARE
  v_user_id uuid := '5ada845a-be06-4877-88b4-bc0b7e3f8c7a';
  v_exists boolean;
  v_meta jsonb;
  v_name text;
BEGIN
  SELECT true, raw_user_meta_data
    INTO v_exists, v_meta
    FROM auth.users WHERE id = v_user_id;

  IF v_exists THEN
    v_name := COALESCE(
      NULLIF(TRIM(v_meta->>'full_name'), ''),
      NULLIF(TRIM(v_meta->>'name'), ''),
      'Kandydat'
    );
    INSERT INTO public.profiles (user_id, full_name, user_type)
    VALUES (v_user_id, v_name, 'candidate')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public._audit_repair_log (action, user_id, payload)
    VALUES ('profile_restored_5ada845a', v_user_id, jsonb_build_object('name', v_name));
  ELSE
    INSERT INTO public._audit_repair_log (action, user_id, payload)
    SELECT 'auth_user_missing_kept_test_results', v_user_id, row_to_json(c)::jsonb
    FROM public.candidate_test_results c WHERE c.user_id = v_user_id;
  END IF;
END $$;
