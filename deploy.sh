#!/bin/bash

echo "🚀 Own AI Assistant - Deployment Script"
echo "========================================"

echo ""
echo "This script will help you deploy your application with separate backend and frontend."
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found!"
    exit 1
fi

echo "✅ Project structure looks good!"
echo ""

echo "📋 Deployment Steps:"
echo "1. Deploy backend to Railway/Render/DigitalOcean"
echo "2. Get the backend URL"
echo "3. Update frontend configuration with backend URL"
echo "4. Deploy frontend to Vercel"
echo ""

echo "🔧 Backend Deployment Options:"
echo "   A) Railway (Recommended - Free tier available)"
echo "   B) Render (Free tier available)"
echo "   C) DigitalOcean App Platform"
echo ""

read -p "Choose backend deployment option (A/B/C): " backend_choice

case $backend_choice in
    A|a)
        echo ""
        echo "🚂 Deploying to Railway..."
        echo "1. Go to https://railway.app"
        echo "2. Sign up with GitHub"
        echo "3. Create new project from GitHub repo"
        echo "4. Set root directory to 'backend'"
        echo "5. Add environment variables:"
        echo "   - OPENAI_API_KEY"
        echo "   - CLAUDE_API_KEY"
        echo "   - GEMINI_API_KEY"
        echo "   - JWT_SECRET"
        echo "   - FRONTEND_URL (set after frontend deployment)"
        echo ""
        echo "6. Deploy and get your backend URL"
        ;;
    B|b)
        echo ""
        echo "🎨 Deploying to Render..."
        echo "1. Go to https://render.com"
        echo "2. Sign up with GitHub"
        echo "3. Create new Web Service"
        echo "4. Connect your GitHub repo"
        echo "5. Set root directory to 'backend'"
        echo "6. Set build command: npm install && npm run build"
        echo "7. Set start command: npm start"
        echo "8. Add environment variables (same as Railway)"
        ;;
    C|c)
        echo ""
        echo "🐙 Deploying to DigitalOcean..."
        echo "1. Go to https://digitalocean.com"
        echo "2. Create App Platform"
        echo "3. Connect GitHub repo"
        echo "4. Set source directory to 'backend'"
        echo "5. Configure environment variables"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🌐 Frontend Deployment:"
echo "1. Go to https://vercel.com"
echo "2. Import your GitHub repository"
echo "3. Configure build settings:"
echo "   - Framework: Vite"
echo "   - Build Command: cd frontend && npm install && npm run build"
echo "   - Output Directory: frontend/dist"
echo "4. Deploy"
echo ""

echo "📝 After deployment:"
echo "1. Get your backend URL"
echo "2. Update frontend/src/config/api.ts with your backend URL"
echo "3. Redeploy frontend if needed"
echo "4. Test the complete application"
echo ""

echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo ""

echo "🎉 Good luck with your deployment!" 