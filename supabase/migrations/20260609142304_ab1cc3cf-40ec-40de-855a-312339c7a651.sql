-- 1) Usuń puste duplikaty dla konkretnego usera, zostaw ten z wynikami
DELETE FROM public.candidate_test_results
WHERE user_id = 'f185f62d-2fa3-453f-9b0b-d10185fb8326'
  AND id <> '010ab1f9-9f8e-474d-bdad-88c3c9463aba';

-- 2) Globalna deduplikacja defensywna (gdyby pojawiły się przed założeniem UNIQUE)
WITH ranked AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        (CASE WHEN komunikacja_score IS NOT NULL THEN 1 ELSE 0 END
         + CASE WHEN culture_relacja_wspolpraca IS NOT NULL THEN 1 ELSE 0 END
         + CASE WHEN all_tests_completed THEN 1 ELSE 0 END
         + CASE WHEN profile_ready THEN 1 ELSE 0 END) DESC,
        updated_at DESC NULLS LAST,
        created_at DESC NULLS LAST
    ) AS rn
  FROM public.candidate_test_results
)
DELETE FROM public.candidate_test_results c
USING ranked r
WHERE c.id = r.id AND r.rn > 1;

-- 3) UNIQUE constraints, idempotentnie
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'candidate_test_results_user_id_key'
  ) THEN
    ALTER TABLE public.candidate_test_results
      ADD CONSTRAINT candidate_test_results_user_id_key UNIQUE (user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employer_profiles_user_id_key'
  ) THEN
    ALTER TABLE public.employer_profiles
      ADD CONSTRAINT employer_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;