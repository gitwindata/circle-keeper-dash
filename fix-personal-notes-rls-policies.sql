-- Fix Personal Notes RLS Policies
-- This allows hairstylists to see:
-- 1. Their own notes (both private and public)
-- 2. Public notes from other hairstylists

-- Drop the existing policy first
DROP POLICY IF EXISTS "Hairstylists can manage their own notes" ON personal_notes;

-- Create separate policies for better control
-- Policy 1: Hairstylists can manage (insert, update, delete) their own notes only
CREATE POLICY "Hairstylists can manage their own notes" ON personal_notes FOR ALL USING (hairstylist_id = auth.uid ())
WITH
    CHECK (hairstylist_id = auth.uid ());

-- Policy 2: Hairstylists can view their own notes (private and public)
CREATE POLICY "Hairstylists can view their own notes" ON personal_notes FOR
SELECT USING (hairstylist_id = auth.uid ());

-- Policy 3: Hairstylists can view public notes from other hairstylists
CREATE POLICY "Hairstylists can view public notes" ON personal_notes FOR
SELECT USING (
        is_private = false
        AND EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE
                id = auth.uid ()
                AND role = 'hairstylist'
        )
    );

-- Policy 4: Keep admin access (existing policy remains the same)
-- CREATE POLICY "Admins can view all personal notes" ON personal_notes FOR SELECT USING (
--     EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
-- );