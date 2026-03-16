import express from 'express';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createBucket,
  getBuckets,
  getBucketById,
  updateBucket,
  deleteBucket,
  createBucketEntry,
  getBucketEntries,
  updateBucketEntry,
  deleteBucketEntry,
  attachBucketToConversation,
  detachBucketFromConversation,
  getConversationBuckets,
  getConversationById,
} from '../services/databaseService';

const router = express.Router();

// ── Bucket CRUD ───────────────────────────────────────

// POST /api/buckets — Create bucket
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Bucket name is required' });
    }
    const bucket = await createBucket(userId, name.trim(), description);
    res.json(bucket);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create bucket' });
  }
});

// GET /api/buckets — List user's buckets
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const buckets = await getBuckets(userId);
    res.json(buckets);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch buckets' });
  }
});

// ── Conversation–Bucket Attachment ────────────────────
// ⚠ These MUST be before /:id routes to avoid Express matching
// "attach"/"detach"/"conversation" as a bucket id

// POST /api/buckets/attach — Attach bucket to conversation
router.post('/attach', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { conversationId, bucketId } = req.body;
    if (!conversationId || !bucketId) {
      return res.status(400).json({ error: 'conversationId and bucketId are required' });
    }
    // Verify ownership of both conversation and bucket
    const [conv, bucket] = await Promise.all([
      getConversationById(conversationId, userId),
      getBucketById(bucketId, userId),
    ]);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (!bucket) return res.status(404).json({ error: 'Bucket not found' });
    await attachBucketToConversation(conversationId, bucketId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to attach bucket' });
  }
});

// POST /api/buckets/detach — Detach bucket from conversation
router.post('/detach', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { conversationId, bucketId } = req.body;
    if (!conversationId || !bucketId) {
      return res.status(400).json({ error: 'conversationId and bucketId are required' });
    }
    // Verify conversation ownership
    const conv = await getConversationById(conversationId, userId);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    await detachBucketFromConversation(conversationId, bucketId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to detach bucket' });
  }
});

// GET /api/buckets/conversation/:convId — Get buckets attached to a conversation
router.get('/conversation/:convId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    // Verify conversation ownership
    const conv = await getConversationById(req.params.convId, userId);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    const buckets = await getConversationBuckets(req.params.convId);
    res.json(buckets);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch conversation buckets' });
  }
});

// ── Parameterized bucket routes (must come AFTER named routes) ──

// GET /api/buckets/:id — Get bucket with entries
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const bucket = await getBucketById(req.params.id, userId);
    if (!bucket) return res.status(404).json({ error: 'Bucket not found' });
    const entries = await getBucketEntries(bucket.id);
    res.json({ ...bucket, entries });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch bucket' });
  }
});

// PUT /api/buckets/:id — Update bucket name/description
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { name, description } = req.body;
    await updateBucket(req.params.id, userId, { name, description });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update bucket' });
  }
});

// DELETE /api/buckets/:id — Delete bucket
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    await deleteBucket(req.params.id, userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete bucket' });
  }
});

// ── Bucket Entry CRUD ─────────────────────────────────

// POST /api/buckets/:id/entries — Create entry
router.post('/:id/entries', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const bucket = await getBucketById(req.params.id, userId);
    if (!bucket) return res.status(404).json({ error: 'Bucket not found' });
    const { title = '', content = '' } = req.body;
    const entry = await createBucketEntry(bucket.id, title, content);
    res.json(entry);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create entry' });
  }
});

// PUT /api/buckets/:id/entries/:entryId — Update entry
router.put('/:id/entries/:entryId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const bucket = await getBucketById(req.params.id, userId);
    if (!bucket) return res.status(404).json({ error: 'Bucket not found' });
    const { title, content } = req.body;
    await updateBucketEntry(req.params.entryId, { title, content });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update entry' });
  }
});

// DELETE /api/buckets/:id/entries/:entryId — Delete entry
router.delete('/:id/entries/:entryId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const bucket = await getBucketById(req.params.id, userId);
    if (!bucket) return res.status(404).json({ error: 'Bucket not found' });
    await deleteBucketEntry(req.params.entryId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete entry' });
  }
});

export { router as bucketRoutes };
