# RLS Infinite Recursion Fix Guide

## 🚨 **Problem Description**
You're experiencing a **Row Level Security (RLS) infinite recursion error** in Supabase:

```
Error: infinite recursion detected in policy for relation "user_profiles"
Code: 42P17
```

This happens when RLS policies reference themselves or create circular dependencies.

## 🎯 **Immediate Solutions**

### **Option 1: Quick Fix - Disable RLS Temporarily**
1. Go to Supabase Dashboard → SQL Editor
2. Run the script: `disable-rls-for-testing.sql`
3. This will:
   - Disable RLS on user_profiles table
   - Create your missing user profile
   - Allow login to work immediately

### **Option 2: Fix RLS Policies Properly**
1. Go to Supabase Dashboard → SQL Editor
2. Run the script: `fix-rls-policies.sql`
3. This will:
   - Remove problematic policies
   - Create new, non-recursive policies
   - Keep security while fixing the recursion

## 🔧 **Understanding the Issue**

### What Caused This?
The original RLS policies in your database schema likely contain references that create circular dependencies:

```sql
-- PROBLEMATIC POLICY (causes recursion)
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    --       ^^^^^^^^^^^^^ This queries user_profiles from within a user_profiles policy!
);
```

### The Fix:
```sql
-- GOOD POLICY (no recursion)
CREATE POLICY "Enable read access for users to their own profile" ON user_profiles
FOR SELECT USING (auth.uid() = id);
```

## 📋 **Step-by-Step Fix Process**

### Step 1: Immediate Fix (Choose One)

#### Option A: Disable RLS (Fastest)
```sql
-- Run in Supabase SQL Editor
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Create your profile
INSERT INTO user_profiles (id, email, role, full_name, is_active) VALUES
('c37a936a-4ec2-4758-ac5c-dba3cdbfe263', 'admin@haijoel.com', 'admin', 'System Administrator', true);
```

#### Option B: Fix Policies (Recommended)
```sql
-- Run the fix-rls-policies.sql script
```

### Step 2: Test Login
1. Try logging in with: admin@haijoel.com / admin123
2. You should now be able to access the dashboard

### Step 3: Re-enable Security (If you disabled RLS)
After confirming login works, re-enable RLS with proper policies:

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for users to their own profile" ON user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable update access for users to their own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert access for authenticated users" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);
```

## 🛡️ **Proper RLS Policy Design**

### ✅ **Good Policies (No Recursion)**
```sql
-- Users can read their own profile
CREATE POLICY "user_select_own" ON user_profiles
FOR SELECT USING (auth.uid() = id);

-- Service role has full access
CREATE POLICY "service_role_all" ON user_profiles
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

### ❌ **Bad Policies (Causes Recursion)**
```sql
-- DON'T DO THIS - queries same table in policy
CREATE POLICY "admin_all" ON user_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
```

## 🔄 **Testing Your Fix**

### Before Fix:
```
❌ GET /rest/v1/user_profiles?select=*&id=eq.xxx 500 (Internal Server Error)
❌ Error: infinite recursion detected in policy
```

### After Fix:
```
✅ GET /rest/v1/user_profiles?select=*&id=eq.xxx 200 (OK)
✅ User profile loaded successfully
✅ Redirected to dashboard
```

## 📊 **Verification Commands**

Run these in Supabase SQL Editor to check your setup:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Check current policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Test profile access
SELECT id, email, role, full_name 
FROM user_profiles 
WHERE id = 'c37a936a-4ec2-4758-ac5c-dba3cdbfe263';
```

## 🚨 **Important Notes**

1. **Temporary Disabling**: If you disable RLS for testing, remember to re-enable it for security
2. **Profile Creation**: Make sure to create the user profile after fixing RLS
3. **Service Role**: Use service role key for admin operations that need to bypass RLS
4. **Testing**: Always test policies before deploying to production

## 🆘 **If Problems Persist**

1. Check browser console for new error messages
2. Verify Supabase project URL and keys are correct
3. Ensure the user exists in auth.users table
4. Try accessing the debug page: `/debug-auth`

Run the appropriate SQL script and your login should work immediately!