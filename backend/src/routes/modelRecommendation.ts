import express from 'express';
import { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { recommendModel } from '../services/modelSelectionService';

const router = express.Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, attachments, conversationContext, userPreference } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    const recommendation = recommendModel(
      prompt,
      attachments,
      conversationContext,
      userPreference
    );

    res.json(recommendation);
  } catch (err: any) {
    console.error('Model recommendation error:', err);
    res.status(500).json({ error: 'Failed to recommend model' });
  }
});

export { router as modelRecommendationRoutes };
