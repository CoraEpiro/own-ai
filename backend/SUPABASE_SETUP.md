# Supabase Setup Guide

This guide will help you set up Supabase for your Own AI application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `own-ai` (or your preferred name)
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

## 2. Get Your Connection Details

Once your project is created:

1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key
5. Copy the **service_role** key (keep this secret!)

## 3. Set Environment Variables

Add these to your backend `.env` file:

```env
# Supabase Configuration
CONNECTION_STRING=postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 4. Create Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql` from this project
3. Paste and run the SQL commands

Or use the Supabase CLI:

```bash
supabase db push
```

## 5. Configure Row Level Security (RLS)

The schema includes RLS policies, but you may need to adjust them based on your authentication setup.

## 6. Test the Connection

Start your backend server and check the logs. You should see:
- `CONNECTION_STRING: true`
- `SUPABASE_URL: [your-project-url]`
- `SUPABASE_ANON_KEY: true`
- `SUPABASE_SERVICE_ROLE_KEY: true`

## 7. Deploy

When deploying to Railway, Render, or other platforms:

1. Add the environment variables in your deployment platform
2. Make sure to use the **service_role** key for backend operations
3. Use the **anon** key for frontend operations (if needed)

## Troubleshooting

### Connection Issues
- Verify your connection string format
- Check that your IP is not blocked
- Ensure the database password is correct

### RLS Policy Issues
- If you get permission errors, check the RLS policies
- You may need to disable RLS during development: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

### Environment Variables
- Make sure all variables are set correctly
- Check for typos in variable names
- Restart your server after changing environment variables 