#!/bin/bash

# Railway Environment Variables Setup Script
# This script will set all required environment variables for your Railway deployment

echo "🚀 Setting up Railway environment variables..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Link to project (if not already linked)
echo "🔗 Linking to Railway project..."
railway link

# Set environment variables
echo "📝 Setting environment variables..."

# JWT Authentication

# Database Connection

# Supabase Configuration
railway variables set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3lhaW5xY2xveWltdWJqaGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0OTE0MTksImV4cCI6MjA2NzA2NzQxOX0.AzAP3NR_BmJhmEzbxIFViM2x0-tmnh-4hz20mKUtNE0"

railway variables set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3lhaW5xY2xveWltdWJqaGlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ5MTQxOSwiZXhwIjoyMDY3MDY3NDE5fQ.fsh_wk3sseHK775o7IfGhbCOF7S_m4xuVlgcLglriYQ"

# API Keys



# Frontend URL
railway variables set FRONTEND_URL="https://own-ai.aliguliyev.com"

echo "✅ Environment variables set successfully!"

# Deploy the changes
echo "🚀 Deploying to Railway..."
railway up

echo "🎉 Deployment complete!"
echo "📊 Check your Railway dashboard for deployment status"
echo "🔗 Your app should be available at: https://own-ai-production.up.railway.app"
echo "🏥 Health check: https://own-ai-production.up.railway.app/health" 