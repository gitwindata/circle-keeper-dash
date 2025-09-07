-- Temporary disable RLS for visit_photos to test (ONLY for debugging)
-- NEVER run this in production!
ALTER TABLE visit_photos DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable it:
-- ALTER TABLE visit_photos ENABLE ROW LEVEL SECURITY;
