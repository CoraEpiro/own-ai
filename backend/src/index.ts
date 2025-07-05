require('dotenv').config();
console.log('DEBUG ENV:', process.env.OPENAI_API_KEY, process.env.CLAUDE_API_KEY, process.env.GEMINI_API_KEY);

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRoutes } from './routes/auth';
import { chatRoutes } from './routes/chat';
import { userRoutes } from './routes/user';
import { dashboardRoutes } from './routes/dashboard';
import { modelsRoutes } from './routes/models';
import { errorHandler } from './middleware/errorHandler';
import { logConfigStatus } from './config';
import { streamChatRoutes } from './routes/streamChat';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://own-is145gjpt-coraepiros-projects.vercel.app',
  'https://own-ai-alpha.vercel.app',
  process.env.FRONTEND_URL,
  'https://own-ai.aliguliyev.com'
].filter(Boolean);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({ 
    message: 'Own AI Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      chat: '/api/chat',
      user: '/api/user',
      dashboard: '/api/dashboard',
      models: '/api/models',
      streamChat: '/api/stream-chat'
    },
    documentation: 'This is the backend API for the Own AI Assistant platform'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stream-chat', streamChatRoutes);
app.use('/api/models', modelsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Log config status after dotenv loads
logConfigStatus();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Allowed origins:`, allowedOrigins);
}); 