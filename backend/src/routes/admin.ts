import express from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import {
  createAdminTransaction,
  createUserFeedback,
  getAdminFeedback,
  getAdminOverview,
  getAdminTransactions,
  getAdminUsersOverview,
  setUserAdmin,
  updateAdminFeedback,
  updateAdminTransaction,
} from '../services/databaseService';

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get('/overview', async (_req, res) => {
  try {
    const data = await getAdminOverview();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to load admin overview' });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const users = await getAdminUsersOverview();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to load users' });
  }
});

router.patch(
  '/users/:userId/role',
  body('isAdmin').isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const userId = req.params?.userId;
      if (!userId) return res.status(400).json({ error: 'User ID required' });
      await setUserAdmin(userId, req.body.isAdmin);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to update role' });
    }
  }
);

router.get('/feedback', async (_req, res) => {
  try {
    const rows = await getAdminFeedback();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to load feedback' });
  }
});

router.patch(
  '/feedback/:feedbackId',
  body('status').optional().isIn(['open', 'in_review', 'resolved', 'dismissed']),
  body('adminNote').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const feedbackId = req.params?.feedbackId;
      if (!feedbackId) return res.status(400).json({ error: 'Feedback ID required' });
      await updateAdminFeedback(feedbackId, {
        status: req.body.status,
        adminNote: req.body.adminNote,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to update feedback' });
    }
  }
);

router.get('/transactions', async (_req, res) => {
  try {
    const rows = await getAdminTransactions();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to load transactions' });
  }
});

router.post(
  '/transactions',
  body('type').isIn(['usage_charge', 'credit', 'refund', 'adjustment']),
  body('amount').isNumeric(),
  body('description').isString().isLength({ min: 1, max: 500 }),
  body('userId').optional().isString(),
  body('currency').optional().isString(),
  body('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']),
  body('scheduledFor').optional().isString(),
  body('metadata').optional().isObject(),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const tx = await createAdminTransaction({
        userId: req.body.userId,
        type: req.body.type,
        amount: Number(req.body.amount),
        description: req.body.description,
        currency: req.body.currency,
        status: req.body.status,
        scheduledFor: req.body.scheduledFor || null,
        metadata: req.body.metadata || {},
      });
      res.status(201).json(tx);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to create transaction' });
    }
  }
);

router.patch(
  '/transactions/:transactionId',
  body('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']),
  body('description').optional().isString(),
  body('scheduledFor').optional().isString(),
  body('metadata').optional().isObject(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const transactionId = req.params?.transactionId;
      if (!transactionId) return res.status(400).json({ error: 'Transaction ID required' });
      await updateAdminTransaction(transactionId, {
        status: req.body.status,
        description: req.body.description,
        scheduledFor: req.body.scheduledFor,
        metadata: req.body.metadata,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to update transaction' });
    }
  }
);

export const publicAdminRoutes = express.Router();
publicAdminRoutes.post(
  '/',
  authMiddleware,
  body('type').isIn(['suggestion', 'report']),
  body('subject').isString().isLength({ min: 1, max: 200 }),
  body('message').isString().isLength({ min: 1, max: 5000 }),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const userId = req.user?.id || null;
      const row = await createUserFeedback(
        userId,
        req.body.type,
        req.body.subject,
        req.body.message
      );
      res.status(201).json({ id: row.id, status: row.status });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to submit feedback' });
    }
  }
);

export { router as adminRoutes };
