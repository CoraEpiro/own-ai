import express from 'express';
import { MODEL_DEFINITIONS } from '../config/models';

const router = express.Router();

router.get('/', (_req, res) => {
  const models = MODEL_DEFINITIONS.map(m => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    description: m.description,
    maxTokens: m.maxTokens,
    contextWindow: m.contextWindow,
    costPer1kTokens: m.costPer1kTokens,
    isAvailable: !!process.env[m.apiKeyEnvVar],
    capabilities: m.capabilities ?? [],
    category: m.category ?? 'general',
  }));
  res.json({ models });
});

export { router as modelsRoutes };
