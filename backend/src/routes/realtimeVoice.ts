import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { IncomingMessage } from 'http';
import { parse as parseUrl } from 'url';
import {
  createConversation,
  saveConversationMessage,
  updateConversationTitle,
} from '../services/databaseService';

const VALID_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];
const VALID_MODELS = ['gpt-realtime-1.5', 'gpt-realtime', 'gpt-realtime-mini'];

// Pricing per 1M tokens (audio)
// Audio input: 1 token = 100ms, so 1 min = 600 tokens, 1M tokens = ~27.8 hours
// Audio output: 1 token = 50ms, so 1 min = 1200 tokens, 1M tokens = ~13.9 hours
const MODEL_PRICING: Record<string, { audioInputPer1M: number; audioOutputPer1M: number }> = {
  'gpt-realtime-1.5': { audioInputPer1M: 32.00, audioOutputPer1M: 64.00 },
  'gpt-realtime':     { audioInputPer1M: 32.00, audioOutputPer1M: 64.00 },
  'gpt-realtime-mini': { audioInputPer1M: 10.00, audioOutputPer1M: 20.00 },
};

/**
 * Sets up a WebSocket server for real-time voice relay to OpenAI's Realtime API.
 *
 * Flow: Browser mic → PCM16 base64 → our WS → OpenAI Realtime WS → audio back
 *
 * Auth: JWT token passed via `?token=` query parameter on upgrade.
 * Voice: Selected via `?voice=` query parameter.
 * Model: Selected via `?model=` query parameter.
 */
export function setupRealtimeWebSocket(server: HttpServer, allowedOrigins: string[]) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    const { pathname, query } = parseUrl(request.url || '', true);

    if (pathname !== '/ws/realtime') {
      socket.destroy();
      return;
    }

    // CORS check on WebSocket upgrade
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      console.log('[realtime-ws] Blocked origin:', origin);
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    // JWT auth from query param
    const token = query.token as string;
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (request as any).userId = decoded.id;
      // Parse voice and model preferences
      const voice = query.voice as string;
      const model = query.model as string;
      (request as any).voice = VALID_VOICES.includes(voice) ? voice : 'ash';
      (request as any).model = VALID_MODELS.includes(model) ? model : 'gpt-realtime-1.5';
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (clientWs: WebSocket, request: IncomingMessage) => {
    const userId = (request as any).userId;
    const voice = (request as any).voice || 'ash';
    const model = (request as any).model || 'gpt-realtime-1.5';
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-realtime-1.5'];

    console.log(`[realtime-ws] User ${userId} connected (model=${model}, voice=${voice})`);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      clientWs.send(JSON.stringify({ type: 'error', message: 'OpenAI API key not configured' }));
      clientWs.close();
      return;
    }

    // Track conversation + cost
    let conversationId: string | null = null;
    let turnCount = 0;
    let sessionStartTime = Date.now();
    // Track audio durations (ms) for cost estimation
    let totalAudioInputMs = 0;
    let totalAudioOutputMs = 0;
    let currentTurnInputStartMs = 0;
    let currentTurnOutputStartMs = 0;
    let currentTurnOutputChunks = 0;

    // Open outbound WebSocket to OpenAI Realtime API
    const openaiWs = new WebSocket(
      `wss://api.openai.com/v1/realtime?model=${model}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      }
    );

    let openaiReady = false;

    openaiWs.on('open', () => {
      openaiReady = true;
      sessionStartTime = Date.now();
      console.log(`[realtime-ws] OpenAI connected (${model}) for user ${userId}`);

      // Configure session: voice, audio format, VAD
      const sessionConfig = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          voice,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1',
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 700,
          },
          instructions: 'You are a helpful, friendly AI assistant. Respond naturally and conversationally. Keep responses concise unless asked for detail.',
        },
      };
      openaiWs.send(JSON.stringify(sessionConfig));

      // Notify client that session is ready
      clientWs.send(JSON.stringify({ type: 'session.ready' }));
    });

    // Relay: OpenAI → Client (with cost tracking)
    openaiWs.on('message', (data) => {
      if (clientWs.readyState !== WebSocket.OPEN) return;
      const str = data.toString();

      // Track audio durations from OpenAI events
      try {
        const msg = JSON.parse(str);
        switch (msg.type) {
          case 'input_audio_buffer.speech_started':
            currentTurnInputStartMs = Date.now();
            break;
          case 'input_audio_buffer.speech_stopped':
            if (currentTurnInputStartMs > 0) {
              totalAudioInputMs += Date.now() - currentTurnInputStartMs;
              currentTurnInputStartMs = 0;
            }
            break;
          case 'response.audio.delta':
            currentTurnOutputChunks++;
            break;
          case 'response.done':
            // Estimate output audio: each chunk ~100ms of PCM16 at 24kHz
            totalAudioOutputMs += currentTurnOutputChunks * 100;
            currentTurnOutputChunks = 0;
            break;
        }
      } catch {
        // Not JSON, forward anyway
      }

      clientWs.send(str);
    });

    openaiWs.on('error', (err) => {
      console.error(`[realtime-ws] OpenAI WS error for user ${userId}:`, err.message);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'error', message: 'OpenAI connection error' }));
      }
    });

    openaiWs.on('close', (code, reason) => {
      console.log(`[realtime-ws] OpenAI WS closed for user ${userId}: ${code} ${reason}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    });

    // Relay: Client → OpenAI (with interception for custom messages)
    clientWs.on('message', (data) => {
      const str = data.toString();

      // Intercept our custom save-turn messages
      try {
        const msg = JSON.parse(str);
        if (msg.type === 'voice.save_turn') {
          saveTurn(userId, msg.userText, msg.assistantText);
          return; // Don't forward to OpenAI
        }
      } catch {
        // Not JSON or parse error — forward as-is
      }

      if (openaiReady && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(str);
      }
    });

    // Estimate cost from audio durations
    function estimateCost(): number {
      // Audio input: 1 token per 100ms → tokens = inputMs / 100
      // Audio output: 1 token per 50ms → tokens = outputMs / 50
      const inputTokens = totalAudioInputMs / 100;
      const outputTokens = totalAudioOutputMs / 50;
      const inputCost = (inputTokens / 1_000_000) * pricing.audioInputPer1M;
      const outputCost = (outputTokens / 1_000_000) * pricing.audioOutputPer1M;
      return inputCost + outputCost;
    }

    // Save a voice turn to the database
    async function saveTurn(uid: string, userText: string, assistantText: string) {
      try {
        // Create conversation on first turn
        if (!conversationId) {
          const title = userText.length > 40
            ? userText.substring(0, 37).trimEnd() + '...'
            : userText;
          const conv = await createConversation(uid, `🎙️ ${title}`, model);
          conversationId = conv.id;
          clientWs.send(JSON.stringify({ type: 'voice.conversation_created', conversationId }));
        }

        turnCount++;
        const cost = estimateCost();
        const costPerMessage = cost / (turnCount * 2); // Split cost across messages

        // Estimate tokens from text length (rough approximation for display)
        const userTokens = Math.ceil(userText.length / 4);
        const assistantTokens = Math.ceil(assistantText.length / 4);

        await saveConversationMessage(uid, conversationId, 'user', userText, model, userTokens, costPerMessage);
        await saveConversationMessage(uid, conversationId, 'assistant', assistantText, model, assistantTokens, costPerMessage);

        // Generate better title after first complete turn
        if (turnCount === 1 && userText.length > 5) {
          const cleanTitle = userText.length > 50
            ? userText.substring(0, 47).trimEnd() + '...'
            : userText;
          updateConversationTitle(conversationId, `🎙️ ${cleanTitle}`).catch(() => {});
        }
      } catch (err) {
        console.error('[realtime-ws] Failed to save turn:', err);
      }
    }

    clientWs.on('close', () => {
      const durationSec = ((Date.now() - sessionStartTime) / 1000).toFixed(1);
      const cost = estimateCost().toFixed(4);
      console.log(`[realtime-ws] Client disconnected: user ${userId} (${durationSec}s, ~$${cost})`);
      if (openaiWs.readyState === WebSocket.OPEN || openaiWs.readyState === WebSocket.CONNECTING) {
        openaiWs.close();
      }
    });

    clientWs.on('error', (err) => {
      console.error(`[realtime-ws] Client WS error for user ${userId}:`, err.message);
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    });
  });

  console.log('[realtime-ws] WebSocket relay ready on /ws/realtime');
}
