import express from 'express';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  moveConversationToFolder,
} from '../services/databaseService';

const router = express.Router();

// POST /api/folders — Create folder
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    const folder = await createFolder(userId, name.trim());
    res.json(folder);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create folder' });
  }
});

// GET /api/folders — List user's folders
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const folders = await getFolders(userId);
    res.json(folders);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch folders' });
  }
});

// PUT /api/folders/move — Move conversation to folder (or unfiled)
// ⚠ Must be BEFORE /:id to avoid Express matching "move" as an id
router.put('/move', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { conversationId, folderId } = req.body;
    if (!conversationId) return res.status(400).json({ error: 'conversationId is required' });
    await moveConversationToFolder(conversationId, userId, folderId || null);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to move conversation' });
  }
});

// PUT /api/folders/:id — Rename folder
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    await updateFolder(req.params.id, userId, name.trim());
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update folder' });
  }
});

// DELETE /api/folders/:id — Delete folder (conversations become unfiled)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    await deleteFolder(req.params.id, userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete folder' });
  }
});

export { router as folderRoutes };
