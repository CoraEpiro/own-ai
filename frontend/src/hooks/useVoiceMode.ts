import { useState, useRef, useCallback, useEffect } from 'react';
import { getWsUrl } from '../config/api';

export type VoiceState = 'connecting' | 'ready' | 'listening' | 'thinking' | 'speaking' | 'error';

export const VOICE_OPTIONS = [
  { id: 'alloy', label: 'Alloy', description: 'Neutral and balanced' },
  { id: 'ash', label: 'Ash', description: 'Clear and confident' },
  { id: 'ballad', label: 'Ballad', description: 'Warm and expressive' },
  { id: 'coral', label: 'Coral', description: 'Bright and friendly' },
  { id: 'echo', label: 'Echo', description: 'Smooth and calm' },
  { id: 'sage', label: 'Sage', description: 'Thoughtful and measured' },
  { id: 'shimmer', label: 'Shimmer', description: 'Gentle and soothing' },
  { id: 'verse', label: 'Verse', description: 'Dynamic and engaging' },
] as const;

export type VoiceId = (typeof VOICE_OPTIONS)[number]['id'];

// ── Realtime model definitions with pricing ───────────────
export const REALTIME_MODELS = [
  {
    id: 'gpt-realtime-1.5',
    label: 'Realtime 1.5',
    description: 'Best quality voice model',
    audioInputPer1M: 32.00,
    audioOutputPer1M: 64.00,
    textInputPer1M: 4.00,
    textOutputPer1M: 16.00,
  },
  {
    id: 'gpt-realtime',
    label: 'Realtime',
    description: 'Fast and capable',
    audioInputPer1M: 32.00,
    audioOutputPer1M: 64.00,
    textInputPer1M: 4.00,
    textOutputPer1M: 16.00,
  },
  {
    id: 'gpt-realtime-mini',
    label: 'Realtime Mini',
    description: 'Cost-efficient',
    audioInputPer1M: 10.00,
    audioOutputPer1M: 20.00,
    textInputPer1M: 0.60,
    textOutputPer1M: 2.40,
  },
  {
    id: 'claude-3.5-sonnet',
    label: 'Claude 3.5 Sonnet',
    description: 'Anthropic voice via STT/TTS',
    audioInputPer1M: 0.00, // Using separate STT pricing
    audioOutputPer1M: 0.00, // Using separate TTS pricing
    textInputPer1M: 3.00,
    textOutputPer1M: 15.00,
  },
] as const;

export type RealtimeModelId = (typeof REALTIME_MODELS)[number]['id'];

interface UseVoiceModeReturn {
  state: VoiceState;
  transcript: string;
  userTranscript: string;
  error: string | null;
  conversationId: string | null;
  connect: (voice?: VoiceId, model?: RealtimeModelId) => void;
  disconnect: () => void;
}

/**
 * Custom hook for real-time voice mode using OpenAI's Realtime API.
 *
 * Handles: WebSocket connection, mic capture (PCM16 @ 24kHz),
 * audio playback via AudioContext, state management, and conversation saving.
 */
export function useVoiceMode(): UseVoiceModeReturn {
  const [state, setState] = useState<VoiceState>('connecting');
  const [transcript, setTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Audio playback scheduling
  const playbackTimeRef = useRef(0);

  // Turn tracking for conversation saving
  const currentUserTextRef = useRef('');
  const currentAssistantTextRef = useRef('');

  // ── Audio Playback ──────────────────────────────────────

  const playAudioChunk = useCallback((base64Audio: string) => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'closed') return;

    // Decode base64 → PCM16 Int16Array → Float32Array
    const binaryStr = atob(base64Audio);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    // Create AudioBuffer and schedule playback
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    // Schedule seamlessly after previous chunk
    const now = ctx.currentTime;
    const startTime = Math.max(now, playbackTimeRef.current);
    source.start(startTime);
    playbackTimeRef.current = startTime + buffer.duration;
  }, []);

  // ── Save completed turn ─────────────────────────────────

  const saveTurn = useCallback(() => {
    const ws = wsRef.current;
    const userText = currentUserTextRef.current.trim();
    const assistantText = currentAssistantTextRef.current.trim();

    if (ws && ws.readyState === WebSocket.OPEN && userText && assistantText) {
      ws.send(JSON.stringify({
        type: 'voice.save_turn',
        userText,
        assistantText,
      }));
    }

    // Reset for next turn
    currentUserTextRef.current = '';
    currentAssistantTextRef.current = '';
  }, []);

  // ── Mic Capture Setup ───────────────────────────────────

  const startMicCapture = useCallback(async (ws: WebSocket) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 24000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    streamRef.current = stream;

    // Create AudioContext at 24kHz for OpenAI
    const audioCtx = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = audioCtx;

    // Load AudioWorklet inline via Blob (avoids extra file)
    const workletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this._buffer = new Int16Array(2400); // 100ms @ 24kHz
          this._pos = 0;
        }

        process(inputs) {
          const input = inputs[0];
          if (!input || !input[0]) return true;

          const samples = input[0];
          for (let i = 0; i < samples.length; i++) {
            // Float32 → PCM16
            const s = Math.max(-1, Math.min(1, samples[i]));
            this._buffer[this._pos++] = s < 0 ? s * 0x8000 : s * 0x7FFF;

            if (this._pos >= this._buffer.length) {
              this.port.postMessage(this._buffer.slice());
              this._pos = 0;
            }
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);
    `;

    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);

    await audioCtx.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);

    const source = audioCtx.createMediaStreamSource(stream);
    sourceNodeRef.current = source;

    const workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor');
    workletNodeRef.current = workletNode;

    // When worklet sends PCM16 buffer → base64 → WebSocket
    workletNode.port.onmessage = (event: MessageEvent) => {
      if (ws.readyState !== WebSocket.OPEN) return;

      const pcm16: Int16Array = event.data;
      const uint8 = new Uint8Array(pcm16.buffer);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64 = btoa(binary);

      ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64,
      }));
    };

    source.connect(workletNode);
    workletNode.connect(audioCtx.destination); // Required for worklet to process
  }, []);

  // ── WebSocket Message Handler ───────────────────────────

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'session.ready':
          setState('ready');
          break;

        case 'session.created':
        case 'session.updated':
          // Session config confirmed
          break;

        case 'input_audio_buffer.speech_started':
          setState('listening');
          // Clear previous AI transcript when user starts new turn
          setTranscript('');
          setUserTranscript('');
          currentAssistantTextRef.current = '';
          currentUserTextRef.current = '';
          break;

        case 'input_audio_buffer.speech_stopped':
          setState('thinking');
          break;

        case 'response.audio.delta':
          if (msg.delta) {
            setState('speaking');
            playAudioChunk(msg.delta);
          }
          break;

        case 'response.audio_transcript.delta':
          if (msg.delta) {
            setTranscript(prev => prev + msg.delta);
            currentAssistantTextRef.current += msg.delta;
          }
          break;

        case 'response.audio_transcript.done':
          // Full AI transcript received — keep displayed
          if (msg.transcript) {
            currentAssistantTextRef.current = msg.transcript;
          }
          break;

        case 'conversation.item.input_audio_transcription.completed':
          // User's speech transcription
          if (msg.transcript) {
            currentUserTextRef.current = msg.transcript;
            setUserTranscript(msg.transcript);
          }
          break;

        case 'response.done':
          // AI finished — save the turn, stay in ready state
          // Keep transcript visible until next speech starts
          setState('ready');
          saveTurn();
          break;

        case 'voice.conversation_created':
          // Backend created a conversation for this session
          if (msg.conversationId) {
            setConversationId(msg.conversationId);
          }
          break;

        case 'error': {
          const errorMsg = msg.error?.message || msg.message || '';
          console.warn('[voice] OpenAI event:', errorMsg);

          // Only show fatal errors to user, not transient ones
          if (errorMsg.includes('authentication') ||
              errorMsg.includes('API key') ||
              errorMsg.includes('rate_limit') ||
              errorMsg === 'OpenAI connection error') {
            setError(errorMsg);
            setState('error');
          }
          // For non-critical errors (e.g. buffer too small), just log
          break;
        }

        default:
          break;
      }
    } catch {
      // Non-JSON message, ignore
    }
  }, [playAudioChunk, saveTurn]);

  // ── Connect ─────────────────────────────────────────────

  const connect = useCallback(async (voice: VoiceId = 'ash', model: RealtimeModelId = 'gpt-realtime-1.5') => {
    setError(null);
    setState('connecting');
    setTranscript('');
    setUserTranscript('');
    setConversationId(null);
    playbackTimeRef.current = 0;
    currentUserTextRef.current = '';
    currentAssistantTextRef.current = '';

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated');
      setState('error');
      return;
    }

    try {
      const wsUrl = getWsUrl(
        `/ws/realtime?token=${encodeURIComponent(token)}&voice=${encodeURIComponent(voice)}&model=${encodeURIComponent(model)}`
      );
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        try {
          await startMicCapture(ws);
        } catch (err: any) {
          console.error('[voice] Mic access denied:', err);
          setError('Microphone access denied. Please allow mic access.');
          setState('error');
          ws.close();
        }
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        if (wsRef.current === ws) {
          setError('Connection failed');
          setState('error');
        }
      };

      ws.onclose = () => {
        // Only update state if not already disconnected by user
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
      };
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      setState('error');
    }
  }, [startMicCapture, handleMessage]);

  // ── Disconnect ──────────────────────────────────────────

  const disconnect = useCallback(() => {
    // Stop mic
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Close WebSocket
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }

    playbackTimeRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { state, transcript, userTranscript, error, conversationId, connect, disconnect };
}
