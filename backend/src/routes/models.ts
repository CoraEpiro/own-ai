import express from 'express';
const router = express.Router();

// Return models as objects with id, name, provider, and description
router.get('/', (req, res) => {
  res.json({ models: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'OpenAI\'s latest flagship model, fast and high quality.' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'OpenAI\'s fast, cost-effective model.' },
    { id: 'claude-v1', name: 'Claude v1', provider: 'Anthropic', description: 'Anthropic\'s helpful, harmless, and honest model.' },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', description: 'Google\'s advanced conversational model.' }
  ] });
});

export { router as modelsRoutes }; 