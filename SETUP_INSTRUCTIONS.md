# Circle Keeper Dashboard - Setup Instructions

## Overview
This guide will help you set up the Circle Keeper Dashboard with Supabase integration for Haijoel Men's Salon.

## Prerequisites
- Node.js 18+ installed
- A Supabase account
- Basic knowledge of React and TypeScript

## Step 1: Supabase Project Setup

### 1.1 Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `circle-keeper-dashboard`
   - Database Password: (generate a strong password)
   - Region: (choose closest to your users)

### 1.2 Get Project Credentials
1. In your Supabase dashboard, go to "Settings" > "API"
2. Copy the following values:
   - Project URL
   - anon/public key

### 1.3 Create Environment File
1. Copy `.env.example` to `.env`
2. Update with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 2: Database Schema Setup

### 2.1 Run Database Schema
1. In Supabase dashboard, go to "SQL Editor"
2. Copy the contents of `database-schema.sql`
3. Paste and run the SQL script
4. This will create all tables, triggers, and policies

### 2.2 Enable Storage
1. Go to "Storage" in Supabase dashboard
2. Create a new bucket called `visit-photos`
3. Set it to public or configure RLS policies as needed

## Step 3: Application Setup

### 3.1 Install Dependencies
```bash
npm install
```

### 3.2 Start Development Server
```bash
npm run dev
```

## Step 4: Create Test Users

### 4.1 Admin User
1. Go to Supabase Auth > Users
2. Add a new user:
   - Email: `admin@haijoel.com`
   - Password: `admin123`
   - Confirm: Yes
3. After creation, note the User ID
4. In SQL Editor, run:
```sql
SELECT update_user_profile_role(
  'user_id_here',
  'admin'::user_role,
  'Admin User'
);
```

### 4.2 Hairstylist User
1. Add user with email: `stylist@haijoel.com`, password: `stylist123`
2. Run SQL to set role:
```sql
SELECT update_user_profile_role(
  'user_id_here',
  'hairstylist'::user_role,
  'Test Hairstylist'
);
```

### 4.3 Member User
1. Add user with email: `member@haijoel.com`, password: `member123`
2. Run SQL to set role:
```sql
SELECT update_user_profile_role(
  'user_id_here',
  'member'::user_role,
  'Test Member'
);
```

## Step 5: Configure Row Level Security (RLS)

The database schema already includes RLS policies, but verify they're working:

1. Test login with each user type
2. Verify role-based access works
3. Check that users can only see their own data

## Features Implemented

### ✅ Completed Features

1. **Unified Login System**
   - Single login page for all roles
   - Automatic role detection and redirection
   - Supabase authentication integration

2. **Service Management**
   - Hardcoded services array with 13 salon services
   - Service validation and combination logic
   - Pricing calculations with membership discounts

3. **Membership System**
   - 5-tier membership levels (Bronze to Diamond)
   - Automatic tier calculation based on visits/spending
   - Progress tracking and benefits

4. **Database Integration**
   - Complete Supabase schema with RLS
   - Comprehensive type definitions
   - Helper functions for data operations

### 🚧 Remaining Features to Implement

1. **Visit Recording System**
   - Multiple services per visit
   - Before/after photo upload
   - Hairstylist notes

2. **Member Assignment**
   - Admin can assign members to multiple hairstylists
   - Primary hairstylist designation

3. **Personal Notes System**
   - Hairstylists can add private notes about members
   - Member preferences tracking

4. **Review System**
   - Members can review services, hairstylists, and barbershop
   - Rating aggregation

5. **Enhanced Dashboards**
   - Role-specific dashboards
   - Analytics and reporting
   - Photo galleries

## Development Workflow

### Testing Roles
1. Admin: Full access to all features
2. Hairstylist: Member management, visit recording
3. Member: Profile, history, reviews

### Database Management
- Use Supabase dashboard for data inspection
- Monitor RLS policy effectiveness
- Regular backups recommended

### Deployment
1. Set up production Supabase project
2. Update environment variables
3. Deploy using Vercel, Netlify, or similar

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check environment variables
   - Verify Supabase project settings
   - Ensure RLS policies allow access

2. **Role-based access issues**
   - Verify user profiles are created
   - Check role assignments in database
   - Test RLS policies

3. **TypeScript errors**
   - Ensure all types are imported correctly
   - Check Supabase type definitions
   - Update type files if schema changes

### Support
- Check Supabase documentation
- Review console errors
- Test API calls in Supabase dashboard

## Next Steps
1. Complete remaining feature implementation
2. Add comprehensive testing
3. Set up production environment
4. User training and documentation