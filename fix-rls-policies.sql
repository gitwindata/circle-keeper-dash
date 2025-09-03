-- ==================================================
-- FIX RLS INFINITE RECURSION ERROR
-- Run this in Supabase SQL Editor to fix the policy error
-- ==================================================

-- First, drop all existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can create any profile" ON user_profiles;

-- Disable RLS temporarily to clean up
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Policy 1: Users can read their own profile
CREATE POLICY "Enable read access for users to their own profile" ON user_profiles
FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile  
CREATE POLICY "Enable update access for users to their own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Enable insert for authenticated users (for automatic profile creation)
CREATE POLICY "Enable insert access for authenticated users" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Service role can do everything (for admin operations)
CREATE POLICY "Enable full access for service role" ON user_profiles
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ==================================================
-- VERIFY POLICIES
-- ==================================================

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Test query (this should work now)
-- SELECT * FROM user_profiles WHERE id = auth.uid();