# Deployment Guide - Separate Backend & Frontend

This guide explains how to deploy the Own AI Assistant with separate backend and frontend deployments.

## Architecture

- **Backend**: Node.js/Express API deployed on Railway, Render, or DigitalOcean
- **Frontend**: React/Vite app deployed on Vercel
- **Database**: File-based storage (JSON files) - can be upgraded to PostgreSQL later

## Backend Deployment

### Option 1: Railway (Recommended)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Initialize git if not already done
   git init
   git add .
   git commit -m "Initial backend commit"
   
   # Connect to Railway
   npx railway login
   npx railway init
   npx railway up
   ```

3. **Set Environment Variables**
   In Railway dashboard, add these environment variables:
   ```
   OPENAI_API_KEY=your_openai_key
   CLAUDE_API_KEY=your_claude_key
   GEMINI_API_KEY=your_gemini_key
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

4. **Get Backend URL**
   - Railway will provide a URL like: `https://your-app-name.railway.app`
   - Your API will be available at: `https://your-app-name.railway.app/api`

### Option 2: Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Deploy Backend**
   - Connect your GitHub repository
   - Select the `backend` directory
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`

3. **Set Environment Variables**
   Same as Railway above.

### Option 3: DigitalOcean App Platform

1. **Create DigitalOcean Account**
   - Go to [digitalocean.com](https://digitalocean.com)

2. **Deploy Backend**
   - Create new app
   - Connect GitHub repository
   - Select backend directory
   - Configure environment variables

## Frontend Deployment

### Deploy to Vercel

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install`

3. **Set Environment Variables**
   ```
   VITE_BACKEND_URL=https://your-backend-url.railway.app/api
   ```

4. **Update API Configuration**
   After getting your backend URL, update `frontend/src/config/api.ts`:
   ```typescript
   export const API_BASE_URL = isDevelopment 
     ? 'http://localhost:3001/api'
     : 'https://your-actual-backend-url.railway.app/api';
   ```

## Local Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will automatically proxy API calls to the local backend during development.

## Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
GEMINI_API_KEY=your_gemini_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### Frontend (.env)
```
VITE_BACKEND_URL=https://your-backend-url.railway.app/api
```

## Troubleshooting

### CORS Issues
- Ensure `FRONTEND_URL` is set correctly in backend environment
- Check that the frontend URL matches exactly (including protocol)

### API Connection Issues
- Verify backend URL is correct in frontend config
- Check backend health endpoint: `https://your-backend-url.railway.app/health`
- Ensure all environment variables are set in backend

### Build Issues
- Make sure all dependencies are installed
- Check TypeScript compilation errors
- Verify build commands are correct

## Security Considerations

1. **Environment Variables**: Never commit API keys to git
2. **CORS**: Configure CORS to only allow your frontend domain
3. **Rate Limiting**: Backend includes rate limiting by default
4. **JWT Secret**: Use a strong, unique JWT secret

## Monitoring

- **Backend Health**: Check `/health` endpoint
- **Logs**: Monitor deployment platform logs
- **Performance**: Use platform-specific monitoring tools

## Next Steps

1. Deploy backend to Railway/Render
2. Get the backend URL
3. Update frontend configuration with backend URL
4. Deploy frontend to Vercel
5. Test the complete application 