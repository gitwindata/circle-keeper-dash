# Login Testing Guide

This guide will help you diagnose and fix the login loading issue in the Circle Keeper Dashboard.

## Quick Troubleshooting Steps

### 1. Access the Debug Page
Navigate to: `http://localhost:3000/debug-auth`

This page provides comprehensive debugging information about:
- Current authentication state
- Database connection status
- User profiles in the database
- Test login functionality

### 2. Check Environment Variables
Ensure your `.env` file contains:
```
VITE_SUPABASE_URL=https://pdlndpbigatoiontnaub.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Verify Database Connection
1. Go to the debug page
2. Check the "Database Connection" section
3. Click "Test Connection" if status shows failed
4. Ensure both Supabase URL and Key show "✅ Configured"

## Common Issues and Solutions

### Issue 1: "User profile not found" Error
**Symptoms**: Login succeeds but shows "User profile not found" message
**Solution**: 
1. Check the "User Profiles" section in debug page
2. If no profiles exist, you need to create them
3. Use the demo-users-setup.sql script or create profiles manually

### Issue 2: Loading State Never Ends
**Symptoms**: Login form shows "Signing in..." indefinitely
**Solutions**:
1. **Check browser console** for error messages
2. **Clear browser cache** and localStorage
3. **Restart the development server**
4. **Check Supabase service status**

### Issue 3: Authentication Success but No Redirect
**Symptoms**: Login succeeds but stays on login page
**Solution**: Check if user profile exists and has correct role

## Step-by-Step Testing Process

### Step 1: Test Database Connection
```bash
# Start the development server
npm run dev

# Navigate to debug page
http://localhost:3000/debug-auth
```

### Step 2: Check User Profiles
In the debug page:
1. Look at "User Profiles" section
2. Verify admin profile exists with email: admin@haijoel.com
3. If no profiles exist, follow the profile creation steps below

### Step 3: Create Test Profiles (if needed)
Option A - Using Supabase Dashboard:
1. Go to Supabase Dashboard > Authentication
2. Create users manually with these emails:
   - admin@haijoel.com
   - stylist@haijoel.com  
   - member@haijoel.com
3. Copy their user IDs
4. Run the demo-users-setup.sql script with actual IDs

Option B - Using Debug Page:
1. If you see auth users without profiles in debug page
2. Click "Create Profile" button next to each user
3. This will automatically create admin profiles

### Step 4: Test Login
1. Use the "Test Login" section in debug page
2. Try these credentials:
   - Email: admin@haijoel.com
   - Password: admin123
3. Watch the browser console for detailed logs

### Step 5: Check Authentication Flow
Look for these console messages:
```
🚀 Starting sign in for: admin@haijoel.com
✅ Supabase auth success: [user-id]
🔍 Fetching user profile...
✅ User profile loaded: admin
🔄 Auth state change: SIGNED_IN [user-id]
🔄 User already authenticated, redirecting...
👑 Redirecting admin to dashboard
```

## Browser Console Debugging

### Key Console Messages to Look For:
1. **Authentication Start**: `🚀 Starting sign in for: [email]`
2. **Auth Success**: `✅ Supabase auth success: [user-id]`
3. **Profile Fetch**: `🔍 Fetching user profile...`
4. **Profile Found**: `✅ User profile found: [profile-data]`
5. **State Change**: `🔄 Auth state change: SIGNED_IN [user-id]`
6. **Redirect**: `👑 Redirecting admin to dashboard`

### Common Error Messages:
- `❌ User profile not found` - Profile missing in database
- `❌ Supabase auth error` - Wrong credentials or connection issue
- `❌ Error fetching user profile` - Database query failed

## Manual Profile Creation (Advanced)

If automatic profile creation fails, create manually in Supabase:

```sql
-- Replace YOUR_USER_ID with actual auth user ID
INSERT INTO user_profiles (id, email, role, full_name, is_active) VALUES
('YOUR_USER_ID', 'admin@haijoel.com', 'admin', 'Test Admin', true);
```

## Troubleshooting Checklist

- [ ] Environment variables are correctly configured
- [ ] Database connection test passes
- [ ] User profiles exist in database
- [ ] Admin profile has email: admin@haijoel.com
- [ ] Browser console shows no error messages
- [ ] Development server is running without errors
- [ ] Supabase service is accessible

## Getting Help

If you continue experiencing issues:

1. **Capture browser console logs** during login attempt
2. **Screenshot the debug page** showing current state
3. **Note the exact error messages** from console
4. **Check Supabase Dashboard** for any service issues

## Expected Login Flow

When working correctly:
1. User enters credentials and clicks "Sign In"
2. Form shows "Signing in..." for 1-3 seconds
3. Success toast appears: "Welcome back, [Name]!"
4. Page redirects to appropriate dashboard based on role
5. Loading state ends and dashboard loads

Total time should be under 5 seconds for the complete flow.