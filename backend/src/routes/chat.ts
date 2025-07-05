import express from 'express';
import { getChatHistory, saveChatMessage } from '../services/databaseService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const userId = req.user?.id;
  const history = await getChatHistory(userId);
  res.json(history);
});

router.post('/', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const userId = req.user?.id;
  const { message } = req.body;
  const saved = await saveChatMessage(userId, message);
  res.json(saved);
});

export { router as chatRoutes }; 