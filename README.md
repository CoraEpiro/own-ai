# Own AI Assistant

A full-stack AI assistant platform with separate backend and frontend deployments.

## 🏗️ Project Structure

```
own-ai/
├── backend/          # Node.js/Express API server
│   ├── src/         # Backend source code
│   ├── data/        # JSON data storage
│   └── package.json # Backend dependencies
├── frontend/        # React/Vite frontend application
│   ├── src/         # Frontend source code
│   └── package.json # Frontend dependencies
├── deploy.sh        # Deployment helper script
├── DEPLOYMENT.md    # Detailed deployment guide
└── vercel.json      # Vercel configuration for frontend
```

## 🚀 Quick Start

### Local Development

1. **Start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start Frontend** (in another terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Desktop App (macOS / Windows)

You can package this same repo as a desktop app (Electron) — no separate project required.

```bash
# one-time install desktop tooling
cd desktop
npm install

# run desktop in dev mode
npm run dev

# create installers
npm run dist:mac   # macOS .dmg + .zip
npm run dist:win   # Windows .exe (NSIS + portable)
```

Desktop packaging outputs are generated in `desktop/dist/`.

### Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deployment:**
```bash
./deploy.sh
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Authentication**: JWT tokens
- **AI Providers**: OpenAI, Claude, Gemini
- **Storage**: File-based JSON (can be upgraded to PostgreSQL)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React icons
- **Charts**: Chart.js, Recharts
- **Markdown**: React Markdown with syntax highlighting

## 📋 Features

- 🤖 **Multi-AI Support**: OpenAI GPT, Claude, Gemini
- 💬 **Real-time Chat**: Streaming responses
- 📊 **Analytics Dashboard**: Usage statistics and charts
- 🔐 **User Authentication**: JWT-based auth system
- 📝 **Markdown Support**: Rich text formatting with LaTeX
- 🎨 **Modern UI**: Responsive design with dark/light themes
- 📱 **Mobile Friendly**: Works on all devices

## 🔧 Environment Variables

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

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [API Documentation](./backend/README.md) - Backend API reference
- [Frontend Guide](./frontend/README.md) - Frontend development guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
