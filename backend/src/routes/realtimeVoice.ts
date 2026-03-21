import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { IncomingMessage } from 'http';
import { parse as parseUrl } from 'url';
import FormData from 'form-data';
import axios from 'axios';
import {
  createConversation,
  saveConversationMessage,
  updateConversationTitle,
} from '../services/databaseService';

const VALID_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'];
const VALID_MODELS = ['gpt-realtime-1.5', 'gpt-realtime', 'gpt-realtime-mini', 'gemini-2.5-flash', 'claude-3.5-sonnet'];

// Pricing per 1M tokens (audio)
// Audio input: 1 token = 100ms, so 1 min = 600 tokens, 1M tokens = ~27.8 hours
// Audio output: 1 token = 50ms, so 1 min = 1200 tokens, 1M tokens = ~13.9 hours
const MODEL_PRICING: Record<string, { audioInputPer1M: number; audioOutputPer1M: number }> = {
  'gpt-realtime-1.5': { audioInputPer1M: 32.00, audioOutputPer1M: 64.00 },
  'gpt-realtime':     { audioInputPer1M: 32.00, audioOutputPer1M: 64.00 },
  'gpt-realtime-mini': { audioInputPer1M: 10.00, audioOutputPer1M: 20.00 },
  'gemini-2.5-flash':  { audioInputPer1M: 0.00, audioOutputPer1M: 0.00 }, // Gemini pricing placeholder
  'claude-3.5-sonnet': { audioInputPer1M: 0.00, audioOutputPer1M: 0.00 }, // Using OpenAI STT/TTS pricing separately
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

  // Handle connection dispatch
  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    const model = (request as any).model || 'gpt-realtime-1.5';
    if (model.startsWith('gemini')) {
      handleGeminiConnection(ws, request);
    } else if (model.includes('claude')) {
      handleClaudeConnection(ws, request);
    } else {
      handleOpenAIConnection(ws, request);
    }
  });
}

/**
 * Handles Claude Realtime workaround (STT -> Claude -> TTS)
 */
async function handleClaudeConnection(clientWs: WebSocket, request: IncomingMessage) {
  const userId = (request as any).userId;
  const voice = (request as any).voice || 'ash';
  // Use latest Claude model if generic claude ID is passed
  const model = 'claude-3-5-sonnet-latest'; 
  
  console.log(`[realtime-ws] User ${userId} connected to Claude Voice Mode (${model})`);

  // We need OpenAI for STT and TTS
  const openaiKey = process.env.OPENAI_API_KEY;
  // We need Anthropic for the LLM
  const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!openaiKey || !claudeKey) {
    clientWs.send(JSON.stringify({ type: 'error', message: 'API keys missing for Claude Voice Mode' }));
    clientWs.close();
    return;
  }

  // Session state
  let isSpeaking = false;
  let silenceStart = 0;
  let audioBuffer: Buffer[] = [];
  const VAD_THRESHOLD = 800; // RMS threshold for speech detection (approx)
  const SILENCE_DURATION = 800; // ms of silence to trigger end of turn

  clientWs.send(JSON.stringify({ type: 'session.created' }));
  clientWs.send(JSON.stringify({ type: 'session.updated' }));

  // Helper: Calculate RMS of PCM16 chunk
  function calculateRMS(buffer: Buffer): number {
    let sum = 0;
    const int16 = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
    for (let i = 0; i < int16.length; i++) {
      sum += int16[i] * int16[i];
    }
    return Math.sqrt(sum / int16.length);
  }

  // Helper: Process Turn
  async function processTurn(audioData: Buffer) {
    try {
      clientWs.send(JSON.stringify({ type: 'input_audio_buffer.speech_stopped' }));
      clientWs.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));

      // 1. STT (OpenAI Whisper)
      // Convert PCM16 to WAV for API
      const wavHeader = Buffer.alloc(44);
      const totalLen = audioData.length + 36;
      wavHeader.write('RIFF', 0);
      wavHeader.writeUInt32LE(totalLen, 4);
      wavHeader.write('WAVE', 8);
      wavHeader.write('fmt ', 12);
      wavHeader.writeUInt32LE(16, 16); // Subchunk1Size
      wavHeader.writeUInt16LE(1, 20); // AudioFormat (PCM)
      wavHeader.writeUInt16LE(1, 22); // NumChannels
      wavHeader.writeUInt32LE(24000, 24); // SampleRate
      wavHeader.writeUInt32LE(24000 * 2, 28); // ByteRate
      wavHeader.writeUInt16LE(2, 32); // BlockAlign
      wavHeader.writeUInt16LE(16, 34); // BitsPerSample
      wavHeader.write('data', 36);
      wavHeader.writeUInt32LE(audioData.length, 40);

      const wavBuffer = Buffer.concat([wavHeader, audioData]);
      
      const formData = new FormData();
      formData.append('file', wavBuffer, { filename: 'audio.wav', contentType: 'audio/wav' });
      formData.append('model', 'whisper-1');

      // STT Request
      const sttResp = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: { Authorization: `Bearer ${openaiKey}`, ...formData.getHeaders() }
      });
      const userText = sttResp.data.text;
      
      if (!userText || userText.trim().length < 2) return; // Ignore noise

      clientWs.send(JSON.stringify({ 
        type: 'conversation.item.input_audio_transcription.completed', 
        transcript: userText 
      }));

      // 2. LLM (Claude)
      const claudeResp = await axios.post('https://api.anthropic.com/v1/messages', {
        model: model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: userText }],
        system: "You are Claude, a helpful AI assistant created by Anthropic. Respond naturally and conversationally. Do not identify as OpenAI."
      }, {
        headers: {
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      });
      
      const assistantText = claudeResp.data.content[0].text;
      clientWs.send(JSON.stringify({ 
        type: 'response.audio_transcript.delta', 
        delta: assistantText 
      }));
      clientWs.send(JSON.stringify({ 
        type: 'response.audio_transcript.done', 
        transcript: assistantText 
      }));

      // 3. TTS (OpenAI)
      const ttsResp = await axios.post('https://api.openai.com/v1/audio/speech', {
        model: 'tts-1',
        voice: voice,
        input: assistantText,
        response_format: 'pcm', // Request RAW PCM
        speed: 1.1
      }, {
        headers: { Authorization: `Bearer ${openaiKey}` },
        responseType: 'arraybuffer'
      });

      // TTS returns 24kHz PCM16 (usually) or close enough for our frontend
      const ttsAudio = Buffer.from(ttsResp.data);
      
      // Send audio in chunks
      const CHUNK_SIZE = 6000; // ~0.25s chunks at 24kHz
      for (let i = 0; i < ttsAudio.length; i += CHUNK_SIZE) {
        if (isSpeaking) {
             console.log('[claude-voice] User interrupted, stopping playback');
             break;
        }
        const chunk = ttsAudio.subarray(i, i + CHUNK_SIZE);
        clientWs.send(JSON.stringify({
          type: 'response.audio.delta',
          delta: chunk.toString('base64')
        }));
        await new Promise(r => setTimeout(r, 50)); // Tiny delay to prevent flooding
      }

      clientWs.send(JSON.stringify({ type: 'response.done' }));
      
    } catch (err: any) {
      console.error('[claude-voice] Error processing turn:', err.message);
      clientWs.send(JSON.stringify({ type: 'error', message: 'Processing error' }));
    }
  }

  clientWs.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'input_audio_buffer.append' && msg.audio) {
        const chunk = Buffer.from(msg.audio, 'base64');
        const rms = calculateRMS(chunk);
        
        // Naive VAD
        if (rms > VAD_THRESHOLD) {
          if (!isSpeaking) {
            isSpeaking = true;
            audioBuffer = []; // Start new turn
            clientWs.send(JSON.stringify({ type: 'input_audio_buffer.speech_started' }));
          }
          silenceStart = 0;
        } else if (isSpeaking) {
          if (silenceStart === 0) silenceStart = Date.now();
          if (Date.now() - silenceStart > SILENCE_DURATION) {
            isSpeaking = false;
            // End of turn detected -> Process
            const fullAudio = Buffer.concat(audioBuffer);
            audioBuffer = [];
            processTurn(fullAudio);
          }
        }

        if (isSpeaking || silenceStart > 0) {
          audioBuffer.push(chunk);
        }
      }
    } catch {}
  });
}

function handleOpenAIConnection(clientWs: WebSocket, request: IncomingMessage) {
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
}


/**
 * Handles connection to Gemini Live API
 */
function handleGeminiConnection(clientWs: WebSocket, request: IncomingMessage) {
  const userId = (request as any).userId;
  const voice = (request as any).voice || 'Puck'; // Default Gemini voice
  const requestedModel = (request as any).model;
  
  // Map internal model ID to Gemini Live API model ID
  // gemini-2.0-flash-exp is the current stable Live API model
  const model = 'gemini-2.0-flash-exp'; 
  
  const apiKey = process.env.GEMINI_API_KEY;

  console.log(`[realtime-ws] User ${userId} connecting to Gemini (requested=${requestedModel}, using=${model})`);

  if (!apiKey) {
    clientWs.send(JSON.stringify({ type: 'error', message: 'Gemini API key not configured' }));
    clientWs.close();
    return;
  }

  // Gemini Live API WebSocket URL
  const host = 'generativelanguage.googleapis.com';
  const path = `/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
  const geminiWs = new WebSocket(`wss://${host}${path}`);

  let geminiReady = false;

  geminiWs.on('open', () => {
    console.log(`[realtime-ws] Gemini connected for user ${userId}`);
    geminiReady = true;

    // 1. Send Setup Message
    const setupMsg = {
      setup: {
        model: `models/${model}`,
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: mapVoiceToGemini(voice)
              }
            }
          }
        },
        system_instruction: {
            parts: [{ text: "You are Gemini, a helpful AI assistant created by Google. Respond naturally and conversationally. Do not identify as OpenAI." }]
        }
      }
    };
    geminiWs.send(JSON.stringify(setupMsg));

    // Notify client
    clientWs.send(JSON.stringify({ type: 'session.created' })); // OpenAI uses session.created
    clientWs.send(JSON.stringify({ type: 'session.updated' }));
  });

  geminiWs.on('message', (data) => {
    try {
      // Gemini sends Blob/Buffer, need to parse JSON if text or Bidi response
      // But commonly it sends a JSON structure
      const msg = JSON.parse(data.toString());

      // Handle Server Content (Audio)
      if (msg.serverContent?.modelTurn?.parts) {
        const parts = msg.serverContent.modelTurn.parts;
        for (const part of parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('audio')) {
            // Translate to OpenAI format for frontend
            clientWs.send(JSON.stringify({
              type: 'response.audio.delta',
              delta: part.inlineData.data
            }));
          } else if (part.text) {
             // Translate text transcript
             clientWs.send(JSON.stringify({
               type: 'response.audio_transcript.delta',
               delta: part.text
             }));
          }
        }
      }

      // Handle Turn Complete
      if (msg.serverContent?.turnComplete) {
        clientWs.send(JSON.stringify({ type: 'response.done' }));
      }

    } catch (e) {
      console.error('[realtime-ws] Gemini message parse error', e);
    }
  });

  geminiWs.on('close', () => {
    console.log(`[realtime-ws] Gemini WS closed for user ${userId}`);
    if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
  });
  
  geminiWs.on('error', (err) => {
    console.error(`[realtime-ws] Gemini WS error:`, err.message);
    if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'error', message: 'Gemini connection error' }));
    }
  });

  // Client -> Gemini
  clientWs.on('message', (data) => {
    const str = data.toString();
    try {
      const msg = JSON.parse(str);
      
      // OpenAI format -> Gemini format
      if (msg.type === 'input_audio_buffer.append') {
        // Send audio chunk
        const geminiAudioMsg = {
          realtime_input: {
            media_chunks: [{
              mime_type: "audio/pcm",
              data: msg.audio // Base64
            }]
          }
        };
        if (geminiReady) geminiWs.send(JSON.stringify(geminiAudioMsg));
      }
      
      // Handle custom events if needed
      if (msg.type === 'voice.save_turn') {
         // (Optional) Implement saving logic for Gemini too
      }

    } catch {}
  });

  clientWs.on('close', () => {
    if (geminiWs.readyState === WebSocket.OPEN) geminiWs.close();
  });
}

function mapVoiceToGemini(voice: string): string {
  // OpenAI voice names -> Gemini voice names
  // Gemini voices: Puck, Charon, Kore, Fenrir, Aoede
  const map: Record<string, string> = {
    'ash': 'Puck',
    'ballad': 'Charon',
    'coral': 'Kore',
    'sage': 'Fenrir',
    'shimmer': 'Aoede',
    'alloy': 'Puck',
    'echo': 'Fenrir',
    'verse': 'Aoede'
  };
  return map[voice] || 'Puck';
}

console.log('[realtime-ws] WebSocket relay ready on /ws/realtime');
