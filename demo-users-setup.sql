-- ==================================================
-- DEMO USER SETUP SCRIPT FOR TESTING
-- Run this in Supabase SQL Editor to create test users
-- ==================================================

-- First, create the auth users through Supabase Auth UI or using the admin.createUser() function
-- Then run this script to create corresponding user profiles

-- ==================================================
-- STEP 1: Create User Profiles
-- ==================================================

-- Create Admin Profile
-- Note: Replace 'your-admin-user-id' with the actual UUID from auth.users
INSERT INTO user_profiles (id, email, role, full_name, phone, is_active) VALUES
(
  'REPLACE_WITH_ACTUAL_ADMIN_USER_ID', 
  'admin@haijoel.com', 
  'admin', 
  'System Administrator', 
  '+628123456789', 
  true
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- Create Hairstylist Profile
INSERT INTO user_profiles (id, email, role, full_name, phone, is_active) VALUES
(
  'REPLACE_WITH_ACTUAL_HAIRSTYLIST_USER_ID', 
  'stylist@haijoel.com', 
  'hairstylist', 
  'John Stylist', 
  '+628123456790', 
  true
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- Create Member Profile
INSERT INTO user_profiles (id, email, role, full_name, phone, is_active) VALUES
(
  'REPLACE_WITH_ACTUAL_MEMBER_USER_ID', 
  'member@haijoel.com', 
  'member', 
  'Test Member', 
  '+628123456791', 
  true
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- ==================================================
-- STEP 2: Create Role-Specific Records
-- ==================================================

-- Create hairstylist record
INSERT INTO hairstylists (id, specialties, experience_years, commission_rate) VALUES
(
  'REPLACE_WITH_ACTUAL_HAIRSTYLIST_USER_ID',
  ARRAY['Haircut', 'Styling', 'Coloring'],
  5,
  15.00
) ON CONFLICT (id) DO NOTHING;

-- Create member record
INSERT INTO members (id, membership_tier, referral_code) VALUES
(
  'REPLACE_WITH_ACTUAL_MEMBER_USER_ID',
  'bronze',
  'MEMBER001'
) ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- VERIFICATION QUERIES
-- Run these to check if profiles were created correctly
-- ==================================================

-- Check auth users (this may require service role access)
-- SELECT id, email, created_at, last_sign_in_at FROM auth.users ORDER BY created_at DESC;

-- Check user profiles
SELECT id, email, role, full_name, is_active, created_at 
FROM user_profiles 
ORDER BY created_at DESC;

-- Check hairstylists
SELECT up.full_name, up.email, h.specialties, h.experience_years
FROM hairstylists h
JOIN user_profiles up ON h.id = up.id;

-- Check members
SELECT up.full_name, up.email, m.membership_tier, m.referral_code
FROM members m
JOIN user_profiles up ON m.id = up.id;

-- ==================================================
-- MANUAL SETUP INSTRUCTIONS
-- ==================================================

/*
STEP-BY-STEP MANUAL SETUP:

1. Go to Supabase Dashboard > Authentication > Users
2. Create new users with these credentials:
   - admin@haijoel.com / admin123
   - stylist@haijoel.com / stylist123  
   - member@haijoel.com / member123

3. Copy the User IDs from the auth.users table
4. Replace the 'REPLACE_WITH_ACTUAL_*_USER_ID' placeholders in this script
5. Run the script in Supabase SQL Editor

ALTERNATIVE: Use the Debug Auth Page
1. Go to http://localhost:3000/debug-auth
2. The page will show you existing auth users
3. Click "Create Profile" button for users without profiles
*/