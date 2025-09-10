-- Remove problematic RLS policies for user_profiles table
-- These policies were causing infinite recursion errors

-- Drop all problematic policies
DROP POLICY IF EXISTS "Hairstylists can view profiles of assigned members" ON user_profiles;

DROP POLICY IF EXISTS "Hairstylists can view profiles of members they served" ON user_profiles;

DROP POLICY IF EXISTS "Hairstylists can view member profiles" ON user_profiles;