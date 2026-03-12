
-- Step 1: Delete duplicate employer_profiles, keeping only the earliest one per user_id
DELETE FROM employer_profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM employer_profiles
  ORDER BY user_id, created_at ASC
);

-- Step 2: Add unique constraint on user_id to prevent future duplicates
ALTER TABLE employer_profiles ADD CONSTRAINT employer_profiles_user_id_unique UNIQUE (user_id);
