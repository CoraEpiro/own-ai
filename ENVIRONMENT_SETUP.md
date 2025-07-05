# Environment Variables Setup Guide

## Issue Summary
Your production environment is missing critical environment variables, causing authentication failures:
- 401 Unauthorized on `/api/auth/login`
- 404 Not Found on `/api/user/me`

## Required Environment Variables

### For Railway Production Deployment

You need to set these environment variables in your Railway project:

```bash
# JWT Authentication

# Database Connection

# Supabase Configuration
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3lhaW5xY2xveWltdWJqaGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0OTE0MTksImV4cCI6MjA2NzA2NzQxOX0.AzAP3NR_BmJhmEzbxIFViM2x0-tmnh-4hz20mKUtNE0"

SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3lhaW5xY2xveWltdWJqaGlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ5MTQxOSwiZXhwIjoyMDY3MDY3NDE5fQ.fsh_wk3sseHK775o7IfGhbCOF7S_m4xuVlgcLglriYQ"

# API Keys



# Frontend URL (optional)
FRONTEND_URL="https://own-ai.aliguliyev.com"
```

## How to Set Environment Variables in Railway

### Method 1: Railway Dashboard
1. Go to your Railway project dashboard
2. Navigate to the backend service
3. Click on "Variables" tab
4. Add each environment variable one by one
5. Click "Deploy" to apply changes

### Method 2: Railway CLI
```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set environment variables
railway variables set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3lhaW5xY2xveWltdWJqaGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0OTE0MTksImV4cCI6MjA2NzA2NzQxOX0.AzAP3NR_BmJhmEzbxIFViM2x0-tmnh-4hz20mKUtNE0"
railway variables set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3lhaW5xY2xveWltdWJqaGlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ5MTQxOSwiZXhwIjoyMDY3MDY3NDE5fQ.fsh_wk3sseHK775o7IfGhbCOF7S_m4xuVlgcLglriYQ"
railway variables set FRONTEND_URL="https://own-ai.aliguliyev.com"

# Deploy the changes
railway up
```

## Verification Steps

After setting the environment variables:

1. **Check Railway Logs**: Monitor the deployment logs to ensure no errors
2. **Test Health Endpoint**: Visit `https://own-ai-production.up.railway.app/health`
3. **Test Authentication**: Try logging in with existing credentials
4. **Check Config Status**: The backend should log configuration status on startup

## Expected Behavior After Fix

- ✅ Login endpoint should return 200 with JWT token
- ✅ `/api/user/me` should return user data
- ✅ Authentication middleware should work properly
- ✅ Database operations should succeed

## Troubleshooting

If issues persist:

1. **Check Railway Logs**: Look for configuration errors
2. **Verify Environment Variables**: Ensure all variables are set correctly
3. **Test Database Connection**: Verify Supabase connection is working
4. **Check CORS Settings**: Ensure frontend URL is in allowed origins

## Security Notes

- Rotate API keys regularly
- Consider using Railway's secret management features
- Never commit environment files to version control 