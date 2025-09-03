-- ==================================================
-- IMMEDIATE FIX FOR USER: c37a936a-4ec2-4758-ac5c-dba3cdbfe263
-- Run this in Supabase SQL Editor to fix your login issue
-- ==================================================

-- Create user profile for the authenticated user
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

-- Verify the profile was created
SELECT id, email, role, full_name, is_active, created_at 
FROM user_profiles 
WHERE id = 'c37a936a-4ec2-4758-ac5c-dba3cdbfe263';