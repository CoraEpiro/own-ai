import express from 'express';
import axios from 'axios';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { encoding_for_model } from '@dqbd/tiktoken';
import { saveChatMessage } from '../services/databaseService';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Model cost table (per 1k tokens)
const modelCosts: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 5.0 / 1_000_000, output: 15.0 / 1_000_000 }, // $5/million input, $15/million output
  'gpt-3.5-turbo': { input: 0.5 / 1_000_000, output: 1.5 / 1_000_000 },
  'claude-v1': { input: 8.0 / 1_000_000, output: 24.0 / 1_000_000 },
  'gemini-pro': { input: 0.5 / 1_000_000, output: 1.5 / 1_000_000 },
};

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured.' });
  }

  let { messages, prompt, model = 'gpt-3.5-turbo', temperature = 0.7 } = req.body;
  if (!messages) {
    if (typeof prompt === 'string' && prompt.trim().length > 0) {
      messages = [{ role: 'user', content: prompt }];
    }
  }
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing or invalid messages array.' });
  }

  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  try {
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Calculate input tokens
    const enc = await encoding_for_model(model);
    const inputText = messages.map(m => m.content).join(' ');
    const inputTokens = enc.encode(inputText).length;

    const response = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        model,
        messages,
        temperature,
        stream: true,
      },
      responseType: 'stream',
    });

    let assistantText = '';
    const stream = response.data as unknown as Readable;
    stream.on('data', (chunk: Buffer) => {
      const chunkStr = chunk.toString();
      // Parse and accumulate assistant content
      chunkStr.split('\n').forEach(line => {
        if (line.startsWith('data: ')) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) assistantText += content;
          } catch {}
        }
      });
      res.write(chunk);
    });
    stream.on('end', async () => {
      try {
        // Calculate output tokens and cost
        const outputTokens = enc.encode(assistantText).length;
        enc.free();
        
        const costPer1k = modelCosts[model] || modelCosts['gpt-3.5-turbo'];
        const inputCost = (inputTokens / 1000) * costPer1k.input;
        const outputCost = (outputTokens / 1000) * costPer1k.output;
        const totalCost = inputCost + outputCost;
        const totalTokens = inputTokens + outputTokens;

        // Save the conversation to database
        const fullMessage = `User: ${messages[messages.length - 1].content}\n\nAssistant: ${assistantText}`;
        await saveChatMessage(userId, fullMessage, model, totalTokens, totalCost);

        // Send a marker for the frontend to pick up
        const badgeMarker = `<!--CONVERSATION_DATA:${JSON.stringify({
          assistantMessage: {
            tokens: totalTokens,
            cost: totalCost,
            model
          }
        })}-->`;
        res.write(badgeMarker);
        res.end();
      } catch (error) {
        console.error('Error saving chat message:', error);
        res.end();
      }
    });
    stream.on('error', (err: any) => {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

export { router as streamChatRoutes }; 