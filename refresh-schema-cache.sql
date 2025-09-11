-- Refresh Supabase schema cache for hairstylists table
-- Run this in your Supabase SQL Editor to refresh the schema cache

-- 1. First, verify the cabang column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'hairstylists' 
  AND column_name = 'cabang';

-- 2. If the above query returns no results, add the column:
-- ALTER TABLE hairstylists ADD COLUMN cabang TEXT;

-- 3. Force a schema refresh by updating table metadata
-- This helps Supabase recognize the new column
SELECT pg_catalog.set_config('search_path', 'public', false);

-- 4. Update any existing hairstylist records to have NULL cabang (optional)
-- UPDATE hairstylists SET cabang = NULL WHERE cabang IS NULL;

-- 5. Verify the column is working by selecting from the table
SELECT id, cabang, specialties, experience_years 
FROM hairstylists 
LIMIT 5;

-- 6. Test insert with cabang (optional test)
-- INSERT INTO hairstylists (id, specialties, experience_years, cabang) 
-- VALUES ('test-id', '{"test"}', 1, 'Test Branch')
-- ON CONFLICT (id) DO UPDATE SET cabang = EXCLUDED.cabang;

-- 7. Clean up test data (if you ran the test insert)
-- DELETE FROM hairstylists WHERE id = 'test-id';