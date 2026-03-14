import express from 'express';
import axios from 'axios';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getModelDefinition } from '../config/models';
import {
  createConversation,
  getConversationById,
  getConversationMessages,
  saveConversationMessage,
  updateConversationTitle,
  updateConversationSummary,
  updateConversationSystemPrompt,
} from '../services/databaseService';
import { streamToProvider } from '../services/providers';

const router = express.Router();

// ── Helpers ────────────────────────────────────────────

function generateTitle(message: string): string {
  const cleaned = message.replace(/\n/g, ' ').trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.substring(0, 47).trimEnd() + '...';
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function trimToTokenBudget(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number
): Array<{ role: string; content: string }> {
  let total = messages.reduce((s, m) => s + estimateTokens(m.content), 0);
  if (total <= maxTokens) return messages;

  const result = [...messages];
  // Keep system message (first) and latest user message (last), trim middle
  while (total > maxTokens && result.length > 2) {
    const removed = result.splice(1, 1)[0];
    total -= estimateTokens(removed.content);
  }
  return result;
}

async function generateAITitle(userMessage: string, assistantResponse: string): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return generateTitle(userMessage);

    const resp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a concise 3-6 word title for this conversation. Return only the title, no quotes or punctuation.',
          },
          { role: 'user', content: userMessage },
          { role: 'assistant', content: assistantResponse.substring(0, 200) },
        ],
        max_tokens: 20,
        temperature: 0.5,
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    return (resp.data as any).choices?.[0]?.message?.content?.trim() || generateTitle(userMessage);
  } catch {
    return generateTitle(userMessage);
  }
}

async function generateSummary(
  conversationId: string,
  messages: Array<{ role: string; content: string }>
) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return;

    const transcript = messages
      .slice(-20)
      .map(m => `${m.role}: ${m.content.substring(0, 300)}`)
      .join('\n');

    const resp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'Summarize this conversation in 2-3 sentences. Capture key facts, user preferences, names, and context needed for continuity. Be concise.',
          },
          { role: 'user', content: transcript },
        ],
        max_tokens: 200,
        temperature: 0.3,
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    const summary = (resp.data as any).choices?.[0]?.message?.content?.trim();
    if (summary) {
      await updateConversationSummary(conversationId, summary);
    }
  } catch (err) {
    console.error('Summary generation failed (non-blocking):', err);
  }
}

// ── Main Stream Endpoint ───────────────────────────────

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  let { prompt, model = 'gpt-5.4', conversationId, systemPrompt, attachments = [], reasoningEffort, deepSearch } = req.body;
  console.log(`[stream-chat] prompt="${prompt?.substring(0, 50)}", model=${model}, attachments=${attachments.length}`);
  if (attachments.length) {
    attachments.forEach((a: any) => console.log(`  attachment: ${a.fileName} type=${a.type} extractedText=${a.extractedText ? a.extractedText.length + 'chars' : 'none'} base64=${a.base64 ? 'yes' : 'no'}`));
  }
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Missing prompt' });
  }
  prompt = prompt.trim();

  const modelDef = getModelDefinition(model);
  if (!modelDef) return res.status(400).json({ error: `Unknown model: ${model}` });

  try {
    // Get or create conversation
    let isNewConversation = false;
    if (conversationId) {
      const existing = await getConversationById(conversationId, userId);
      if (!existing) return res.status(404).json({ error: 'Conversation not found' });
    } else {
      const title = generateTitle(prompt);
      const conv = await createConversation(userId, title, model);
      conversationId = conv.id;
      isNewConversation = true;
    }

    // Load conversation history
    const historyRows = await getConversationMessages(conversationId);
    // Re-inject file content from stored attachments so the AI retains file context
    const historyMessages = historyRows.map(r => {
      let content = r.message;
      if (r.role === 'user' && r.attachments?.length) {
        for (const att of r.attachments) {
          if (att.extractedText) {
            content += `\n\n---\n📎 File: ${att.fileName}\n\n${att.extractedText}\n---`;
          }
        }
      }
      return { role: r.role, content };
    });

    // Build messages with optional system prompt + summary context
    const conv = await getConversationById(conversationId, userId);
    const allMessages: Array<{ role: string; content: string; attachments?: any[] }> = [];

    // System prompt (custom persona) takes priority
    const effectiveSystemPrompt = systemPrompt || conv?.system_prompt;
    if (effectiveSystemPrompt) {
      allMessages.push({ role: 'system', content: effectiveSystemPrompt });
      // Save system prompt to conversation if new
      if (systemPrompt && isNewConversation) {
        updateConversationSystemPrompt(conversationId, systemPrompt).catch(() => {});
      }
    }

    if (conv?.summary) {
      allMessages.push({
        role: 'system',
        content: `Previous conversation context: ${conv.summary}`,
      });
    }

    allMessages.push(...historyMessages);

    // Process attachments:
    // - Images → sent via multimodal API (base64)
    // - PDFs with base64 → sent via multimodal document API (Anthropic/Google can read PDFs natively)
    // - PDFs/text with extractedText → text injected into prompt as fallback
    let enrichedPrompt = prompt;
    const multimodalAttachments: any[] = [];

    if (attachments.length) {
      for (const att of attachments) {
        // Images always go through multimodal
        if (att.type === 'image' && att.base64) {
          multimodalAttachments.push(att);
        }
        // PDFs with base64: send via multimodal document API for visual reading
        else if (att.mimeType === 'application/pdf' && att.base64) {
          multimodalAttachments.push({
            ...att,
            type: 'document',
          });
          // Also append extracted text if available (as helpful context)
          if (att.extractedText && !att.extractedText.startsWith('[')) {
            enrichedPrompt += `\n\n---\n📎 File: ${att.fileName} (extracted text):\n\n${att.extractedText}\n---`;
          }
        }
        // Text files: inject content into prompt
        else if (att.extractedText) {
          enrichedPrompt += `\n\n---\n📎 File: ${att.fileName}\n\n${att.extractedText}\n---`;
        }
      }
    }

    allMessages.push({
      role: 'user',
      content: enrichedPrompt,
      ...(multimodalAttachments.length ? { attachments: multimodalAttachments } : {}),
    });

    // Token budgeting
    const contextLimit = modelDef.contextWindow - modelDef.maxTokens - 500;
    const budgetedMessages = trimToTokenBudget(allMessages, contextLimit);

    // Save ORIGINAL prompt for clean display; store extractedText inside attachments JSON
    // so we can re-inject file content when building AI context from history
    const userTokens = estimateTokens(enrichedPrompt);
    const dbAttachments = attachments.map((a: any) => ({
      id: a.id, type: a.type, mimeType: a.mimeType, fileName: a.fileName, url: a.url, size: a.size,
      ...(a.extractedText ? { extractedText: a.extractedText } : {}),
    }));
    await saveConversationMessage(userId, conversationId, 'user', prompt, model, userTokens, 0, dbAttachments.length ? dbAttachments : undefined);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream from the appropriate provider
    const assistantText = await streamToProvider(modelDef.provider, budgetedMessages, model, res, { reasoningEffort, deepSearch });

    // Calculate cost
    const outputTokens = estimateTokens(assistantText);
    const inputCost = (userTokens / 1000) * modelDef.costPer1kTokens.input;
    const outputCost = (outputTokens / 1000) * modelDef.costPer1kTokens.output;
    const totalCost = inputCost + outputCost;
    const totalTokens = userTokens + outputTokens;

    // Save assistant message
    await saveConversationMessage(userId, conversationId, 'assistant', assistantText, model, totalTokens, totalCost);

    // Send metadata as a proper SSE event so the frontend can parse it
    const meta = JSON.stringify({
      type: 'meta',
      conversationId,
      assistantMessage: { tokens: totalTokens, cost: totalCost, model },
    });
    res.write(`data: ${meta}\n\n`);
    res.end();

    // Async background tasks (don't block response)
    if (isNewConversation) {
      generateAITitle(prompt, assistantText).then(title => {
        updateConversationTitle(conversationId, title);
      });
    }

    // Generate/update summary every 6+ messages (every 4 messages after that)
    const messageCount = historyRows.length + 2;
    if (messageCount >= 6 && messageCount % 4 === 0) {
      const allMsgs = [
        ...historyMessages,
        { role: 'user', content: prompt },
        { role: 'assistant', content: assistantText },
      ];
      generateSummary(conversationId, allMsgs);
    }
  } catch (error: any) {
    console.error('Stream chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Streaming failed' });
    } else {
      res.end();
    }
  }
});

// ── Update system prompt on existing conversation ────────
router.put('/system-prompt', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const { conversationId, systemPrompt } = req.body;
  if (!conversationId) return res.status(400).json({ error: 'Missing conversationId' });

  const conv = await getConversationById(conversationId, userId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  await updateConversationSystemPrompt(conversationId, systemPrompt || '');
  res.json({ success: true });
});

export { router as streamChatRoutes };
