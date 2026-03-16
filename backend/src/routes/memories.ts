import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getUserMemories, addMemory, deleteMemory } from '../services/databaseService';

const router = express.Router();

// GET /api/memories — list all memories for authenticated user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const memories = await getUserMemories(userId);
  res.json(memories);
});

// DELETE /api/memories/:id — delete a specific memory
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const { id } = req.params;
  const success = await deleteMemory(id, userId);
  if (!success) return res.status(404).json({ error: 'Memory not found' });
  res.json({ success: true });
});

export { router as memoryRoutes };
