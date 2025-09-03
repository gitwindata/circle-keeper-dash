-- ==================================================
-- TEMPORARY FIX: DISABLE RLS FOR TESTING
-- This disables Row Level Security temporarily to test login
-- ==================================================

-- Disable RLS on user_profiles table
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Create the missing user profile
INSERT INTO user_profiles (id, email, role, full_name, is_active) VALUES
(
  'c37a936a-4ec2-4758-ac5c-dba3cdbfe263', 
  'admin@haijoel.com', 
  'admin', 
  'System Administrator', 
  true
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the profile exists
SELECT id, email, role, full_name, is_active 
FROM user_profiles 
WHERE id = 'c37a936a-4ec2-4758-ac5c-dba3cdbfe263';

-- ==================================================
-- AFTER TESTING, RE-ENABLE RLS WITH CORRECT POLICIES
-- ==================================================

/*
-- Uncomment these lines after login works:

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for users to their own profile" ON user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable update access for users to their own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert access for authenticated users" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);
*/