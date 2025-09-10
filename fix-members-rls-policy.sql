-- ==================================================
-- FIX MEMBERS TABLE RLS POLICY
-- This fixes the issue where hairstylists can't see member data in visit joins
-- ==================================================

-- Problem: The current RLS policy on members table only allows hairstylists to view
-- member data if there's an assignment record. However, when loading visit history,
-- hairstylists should be able to see member data for members they have visited,
-- even without formal assignments.

-- Solution: Update the RLS policy to also allow hairstylists to view member data
-- if they have visits with those members.

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins and assigned hairstylists can view member data" ON members;

-- Create enhanced policy that allows access through visits
CREATE POLICY "Enhanced member data access for hairstylists" ON members FOR SELECT USING (
    -- Members can view their own data
    auth.uid() = id OR 
    -- Admins can view all member data
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin') OR
    -- Assigned hairstylists can view member data (existing functionality)
    EXISTS (SELECT 1 FROM member_hairstylist_assignments WHERE member_id = members.id AND hairstylist_id = auth.uid()) OR
    -- Hairstylists who have visits with the member can view member data (NEW)
    EXISTS (SELECT 1 FROM visits WHERE member_id = members.id AND hairstylist_id = auth.uid())
);

-- Verify the policy was created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'members' AND policyname = 'Enhanced member data access for hairstylists';

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================

-- Test query to verify hairstylists can now access member data through visits
-- Replace 'YOUR_HAIRSTYLIST_ID' with an actual hairstylist ID to test
/*
SELECT 
    v.id as visit_id,
    v.member_id,
    m.id as member_record_id,
    up.full_name as member_name
FROM visits v
LEFT JOIN members m ON v.member_id = m.id
LEFT JOIN user_profiles up ON m.id = up.id
WHERE v.hairstylist_id = 'YOUR_HAIRSTYLIST_ID'
LIMIT 5;
*/

-- ==================================================
-- ROLLBACK (if needed)
-- ==================================================

-- If you need to rollback to the original policy, uncomment and run:
/*
DROP POLICY IF EXISTS "Enhanced member data access for hairstylists" ON members;

CREATE POLICY "Admins and assigned hairstylists can view member data" ON members FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM member_hairstylist_assignments WHERE member_id = members.id AND hairstylist_id = auth.uid())
);
*/