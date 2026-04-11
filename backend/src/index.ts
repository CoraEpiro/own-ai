import express from 'express';
import { createServer } from 'http';
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
import { uploadRoutes } from './routes/upload';
import { audioRoutes } from './routes/audio';
import { folderRoutes } from './routes/folders';
import { bucketRoutes } from './routes/buckets';
import { memoryRoutes } from './routes/memories';
import { modelRecommendationRoutes } from './routes/modelRecommendation';
import { setupRealtimeWebSocket } from './routes/realtimeVoice';
import { adminRoutes, publicAdminRoutes } from './routes/admin';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
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
const isDev = process.env.NODE_ENV !== 'production';

// General limiter — generous in dev, tighter in prod
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 2000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Auth-specific limiter — prevents brute-force in prod, relaxed in dev
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
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
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stream-chat', streamChatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/buckets', bucketRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/recommend-model', modelRecommendationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', publicAdminRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Log config status after dotenv loads
logConfigStatus();

// Attach WebSocket relay for real-time voice
setupRealtimeWebSocket(server, allowedOrigins as string[]);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Allowed origins:`, allowedOrigins);
}); 
