import express from 'express';
import axios from 'axios';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getModelDefinition } from '../config/models';
import { recommendModel } from '../services/modelSelectionService';
import {
  createConversation,
  getConversationById,
  getConversationMessages,
  saveConversationMessage,
  updateConversationTitle,
  updateConversationSummary,
  updateConversationSystemPrompt,
  getUserBio,
  getBucketContentForContext,
  attachBucketToConversation,
  getUserMemories,
  addMemory,
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const transcript = messages
      .slice(-20)
      .map(m => `${m.role}: ${m.content.substring(0, 300)}`)
      .join('\n');

    const resp = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
      {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Summarize this conversation in 2-3 sentences. Capture key facts, user preferences, names, and context needed for continuity. Be concise.\n\n' + transcript,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.3,
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const summary = (resp.data as any).candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (summary) {
      await updateConversationSummary(conversationId, summary);
    }
  } catch (err) {
    console.error('Summary generation failed (non-blocking):', err);
  }
}

async function extractMemories(
  userId: string,
  userMessage: string,
  assistantResponse: string,
  existingMemories: string[]
) {
  try {
    // Skip trivial messages
    if (userMessage.length < 20) return;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return;

    const existingList = existingMemories.length
      ? `\nExisting memories (do NOT duplicate these):\n${existingMemories.map(m => `- ${m}`).join('\n')}`
      : '';

    const resp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract personal facts about the user from this conversation exchange. Only extract concrete, reusable facts (name, preferences, location, job, projects, interests, etc.). Return a JSON array of short strings (max 200 chars each). If no new facts, return []. Do NOT include facts that are already known.${existingList}`,
          },
          {
            role: 'user',
            content: `User said: "${userMessage.substring(0, 500)}"\n\nAssistant replied: "${assistantResponse.substring(0, 500)}"`,
          },
        ],
        max_tokens: 200,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    const raw = (resp.data as any).choices?.[0]?.message?.content?.trim();
    if (!raw) return;

    let facts: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      facts = Array.isArray(parsed) ? parsed : (parsed.facts || parsed.memories || []);
    } catch {
      return;
    }

    // Save each new fact (addMemory handles cap + dedup by content length)
    for (const fact of facts) {
      if (typeof fact === 'string' && fact.trim().length > 5) {
        // Simple duplicate check: skip if any existing memory is very similar
        const lower = fact.toLowerCase().trim();
        const isDuplicate = existingMemories.some(em => {
          const emLower = em.toLowerCase();
          return emLower === lower || emLower.includes(lower) || lower.includes(emLower);
        });
        if (!isDuplicate) {
          await addMemory(userId, fact.trim());
        }
      }
    }
  } catch (err) {
    console.error('Memory extraction failed (non-blocking):', err);
  }
}

// ── Main Stream Endpoint ───────────────────────────────

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  let { prompt, model = 'gpt-5.4', conversationId, systemPrompt, attachments = [], reasoningEffort, deepSearch } = req.body;
  console.log(`[stream-chat] model=${model}, attachments=${attachments.length}, prompt="${prompt?.substring(0, 60)}…"`);
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Missing prompt' });
  }
  prompt = prompt.trim();

  // Handle "Auto" model selection
  if (model === 'auto') {
    const rec = recommendModel(prompt, attachments);
    model = rec.recommendedModel;
    if (rec.enableDeepSearch) deepSearch = true;
    console.log(`[stream-chat] Auto model resolved to: ${model} (DeepSearch: ${deepSearch})`);
  }

  const modelDef = getModelDefinition(model);
  if (!modelDef) return res.status(400).json({ error: `Unknown model: ${model}` });

  try {
    // Get or create conversation
    let isNewConversation = false;
    if (!conversationId) {
      const title = generateTitle(prompt);
      const newConv = await createConversation(userId, title, model);
      conversationId = newConv.id;
      isNewConversation = true;
      // Attach buckets if provided for new conversation
      const bucketIds = req.body.bucketIds;
      if (bucketIds?.length) {
        await Promise.all(bucketIds.map((bId: string) => attachBucketToConversation(conversationId, bId)));
      }
    }

    // Load history, conversation details, user bio, bucket context, and memories in parallel
    const [historyRows, conv, userBio, bucketContext, memoryRows] = await Promise.all([
      getConversationMessages(conversationId),
      getConversationById(conversationId, userId),
      getUserBio(userId),
      getBucketContentForContext(conversationId),
      getUserMemories(userId),
    ]);

    // For existing conversations, verify access
    if (!isNewConversation && !conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

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

    // Build messages array — order matters for LLM context priority
    const allMessages: Array<{ role: string; content: string; attachments?: any[] }> = [];

    // User bio — global persistent context
    if (userBio) {
      allMessages.push({ role: 'system', content: `About the user:\n${userBio}` });
    }

    // User memories — learned facts from past conversations
    if (memoryRows.length) {
      const memoryText = memoryRows.map(m => `- ${m.content}`).join('\n');
      allMessages.push({ role: 'system', content: `User memories (things you've learned about this user):\n${memoryText}` });
    }

    // Knowledge bucket context — attached reference knowledge
    if (bucketContext) {
      allMessages.push({ role: 'system', content: `Reference knowledge:\n${bucketContext}` });
    }

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

    // Extract memories from this exchange (async, non-blocking)
    extractMemories(
      userId,
      prompt,
      assistantText,
      memoryRows.map(m => m.content),
    );
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
