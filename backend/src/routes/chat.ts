import express from 'express';
import {
  getConversations,
  getConversationById,
  getConversationMessages,
  deleteConversation,
} from '../services/databaseService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// List all conversations
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const conversations = await getConversations(userId);
  const result = conversations.map(conv => ({
    id: conv.id,
    userId: conv.user_id,
    title: conv.title,
    model: conv.model,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
    messageCount: conv.messageCount,
    totalTokens: conv.totalTokens,
    totalCost: conv.totalCost,
  }));
  res.json(result);
});

// Load a specific conversation with messages
router.get('/:conversationId', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const conv = await getConversationById(req.params.conversationId, userId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const messages = await getConversationMessages(req.params.conversationId);
  const formattedMessages = messages.map(m => ({
    id: m.id,
    role: m.role,
    content: m.message,
    timestamp: m.timestamp,
    model: m.model,
    tokens: m.tokens_used,
    cost: m.cost,
    attachments: (m.attachments || []).map((a: any) => ({
      id: a.id,
      type: a.type,
      mimeType: a.mimeType,
      fileName: a.fileName,
      url: a.url,
      size: a.size,
    })),
  }));

  res.json({
    conversation: {
      id: conv.id,
      userId: conv.user_id,
      title: conv.title,
      model: conv.model,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messageCount: formattedMessages.length,
      totalTokens: formattedMessages.reduce((s, m) => s + (m.tokens || 0), 0),
      totalCost: formattedMessages.reduce((s, m) => s + (m.cost || 0), 0),
      messages: formattedMessages,
    },
  });
});

// Delete a conversation
router.delete('/:conversationId', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    await deleteConversation(req.params.conversationId, userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as chatRoutes };
