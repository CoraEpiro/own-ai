import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../config';
import { saveConversationMessage } from '../services/databaseService';

const router = express.Router();
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

const TTS_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'];

type PdfAudioMode = 'summary' | 'narration' | 'podcast';
type PodcastSpeaker = 'host' | 'guest';
type PdfAudioJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface PdfAudioResult {
  mode: PdfAudioMode;
  chunks: number;
  scriptPreview: string;
  audioUrl: string;
  audioBase64?: string;
  mimeType: string;
  durationSeconds: number;
  estimatedCostUsd: number;
  estimatedCostBreakdown: {
    scriptUsd: number;
    ttsUsd: number;
    scriptInputTokensApprox: number;
    scriptOutputTokensApprox: number;
    ttsChars: number;
  };
  targetMinutes: number;
}

interface PdfAudioJob {
  id: string;
  userId: string;
  status: PdfAudioJobStatus;
  mode: PdfAudioMode;
  voice: string;
  secondaryVoice: string;
  targetMinutes: number;
  fileName: string;
  conversationId?: string;
  progress: number;
  stage: string;
  createdAt: string;
  updatedAt: string;
  result?: PdfAudioResult;
  error?: string;
}

const pdfAudioJobs = new Map<string, PdfAudioJob>();
const PDF_SCRIPT_INPUT_COST_PER_1K = 0.00015; // gpt-4o-mini approx
const PDF_SCRIPT_OUTPUT_COST_PER_1K = 0.0006; // gpt-4o-mini approx
const PDF_TTS_COST_PER_1M_CHARS = 10; // gpt-4o-mini-tts approx
const DEFAULT_TARGET_MINUTES: Record<PdfAudioMode, number> = {
  summary: 4,
  narration: 8,
  podcast: 15,
};

function prunePdfAudioJobs(maxJobs = 200) {
  if (pdfAudioJobs.size <= maxJobs) return;
  const ordered = [...pdfAudioJobs.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const keep = new Set(ordered.slice(0, maxJobs).map(j => j.id));
  for (const id of pdfAudioJobs.keys()) {
    if (!keep.has(id)) pdfAudioJobs.delete(id);
  }
}

function chunkTextByParagraph(text: string, targetChars = 2600, overlapChars = 220): string[] {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  if (!normalized) return [];

  const paragraphs = normalized
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (!current) {
      current = para;
      continue;
    }
    if ((current.length + 2 + para.length) <= targetChars) {
      current += `\n\n${para}`;
      continue;
    }
    chunks.push(current);
    const tail = current.slice(Math.max(0, current.length - overlapChars));
    current = `${tail}\n\n${para}`.slice(0, targetChars + overlapChars);
  }

  if (current) chunks.push(current);
  return chunks.slice(0, 24); // safety cap
}

function cleanPdfText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer, { max: 120 });
  const text = cleanPdfText(result.text || '');
  if (!text) {
    const pages = result.numpages || 0;
    if (pages > 0) {
      throw new Error('This PDF has no extractable text (likely scanned/image-only).');
    }
    throw new Error('Could not extract text from PDF.');
  }
  return text.slice(0, 140000); // keep cost and latency predictable
}

function makeWavHeader(dataLength: number, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const blockAlign = channels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

function sanitizeSpeechText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parsePodcastTurns(script: string): Array<{ speaker: PodcastSpeaker; text: string }> {
  const turns: Array<{ speaker: PodcastSpeaker; text: string }> = [];
  const lines = script
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const m = line.match(/^(host|guest)\s*:\s*(.+)$/i);
    if (m) {
      const speaker = m[1].toLowerCase() as PodcastSpeaker;
      const text = m[2].trim();
      if (!text) continue;
      const prev = turns[turns.length - 1];
      if (prev && prev.speaker === speaker) {
        prev.text = `${prev.text} ${text}`.replace(/\s+/g, ' ').trim();
      } else {
        turns.push({ speaker, text });
      }
      continue;
    }

    const prev = turns[turns.length - 1];
    if (prev) {
      prev.text = `${prev.text} ${line}`.replace(/\s+/g, ' ').trim();
    }
  }

  return turns.filter(t => t.text.length > 0);
}

function chunkLongSpeech(text: string, maxChars = 1300): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  const parts: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (!current) {
      current = sentence;
      continue;
    }
    if ((current.length + 1 + sentence.length) <= maxChars) {
      current += ` ${sentence}`;
      continue;
    }
    parts.push(current);
    current = sentence;
  }
  if (current) parts.push(current);

  const finalParts: string[] = [];
  for (const part of parts) {
    if (part.length <= maxChars) {
      finalParts.push(part);
      continue;
    }
    for (let i = 0; i < part.length; i += maxChars) {
      finalParts.push(part.slice(i, i + maxChars));
    }
  }
  return finalParts.filter(Boolean);
}

async function generateScriptChunk(
  apiKey: string,
  mode: PdfAudioMode,
  chunk: string,
  index: number,
  total: number,
  previousTail: string,
  targetCharsPerChunk: number,
): Promise<string> {
  const modeInstruction: Record<PdfAudioMode, string> = {
    summary: 'Create a concise spoken summary section. Focus on key points only.',
    narration: 'Create natural narration suitable for listening. Keep flow and clarity.',
    podcast: 'Create a concise podcast dialogue with only "Host:" and "Guest:" lines. Target 8-14 total lines for this chunk.',
  };

  const prompt = [
    `${modeInstruction[mode]}`,
    `This is chunk ${index + 1} of ${total}.`,
    `Aim for approximately ${targetCharsPerChunk} characters of spoken script for this chunk.`,
    previousTail ? `Previous chunk tail for continuity:\n${previousTail}` : '',
    'Use plain spoken language. No markdown. No bullet lists unless naturally spoken.',
    'Source chunk:',
    chunk,
  ].filter(Boolean).join('\n\n');

  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  const attempts = [
    {
      model: 'gpt-4o-mini',
      payload: {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert script writer for spoken audio content.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 900,
        temperature: 0.5,
      },
    },
    {
      model: 'gpt-5-mini',
      payload: {
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: 'You are an expert script writer for spoken audio content.' },
          { role: 'user', content: prompt },
        ],
        max_completion_tokens: 900,
      },
    },
  ];

  let lastErr: any = null;
  for (const attempt of attempts) {
    try {
      const resp = await axios.post('https://api.openai.com/v1/chat/completions', attempt.payload, {
        headers,
        timeout: 60_000,
      });
      const text = sanitizeSpeechText(resp.data?.choices?.[0]?.message?.content || '');
      if (text) return text;
      throw new Error(`Empty script response from ${attempt.model}`);
    } catch (err: any) {
      lastErr = err;
      const detail = err?.response?.data?.error?.message || err?.message || 'Unknown error';
      console.warn(`[pdf-podcast] Script generation attempt failed (${attempt.model}): ${detail}`);
    }
  }

  const finalDetail = lastErr?.response?.data?.error?.message || lastErr?.message || 'Failed to generate script';
  throw new Error(finalDetail);
}

async function synthesizePcm(
  apiKey: string,
  text: string,
  voice: string,
): Promise<Buffer> {
  const resp = await axios.post(
    'https://api.openai.com/v1/audio/speech',
    {
      model: 'gpt-4o-mini-tts',
      voice,
      input: text.slice(0, 4096),
      response_format: 'pcm',
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
      timeout: 90_000,
    },
  );
  return Buffer.from(resp.data);
}

function parseTargetMinutes(raw: any, mode: PdfAudioMode): number {
  const fallback = DEFAULT_TARGET_MINUTES[mode];
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(2, Math.min(60, Math.round(n)));
}

function estimateDurationSecondsFromPcmBytes(byteLen: number): number {
  return byteLen / (2 * 24000); // pcm16 mono @24kHz
}

function estimatePdfAudioCost(params: {
  scriptInputChars: number;
  scriptOutputChars: number;
  ttsChars: number;
}) {
  const scriptInputTokensApprox = Math.ceil(params.scriptInputChars / 4);
  const scriptOutputTokensApprox = Math.ceil(params.scriptOutputChars / 4);
  const scriptUsd =
    (scriptInputTokensApprox / 1000) * PDF_SCRIPT_INPUT_COST_PER_1K +
    (scriptOutputTokensApprox / 1000) * PDF_SCRIPT_OUTPUT_COST_PER_1K;
  const ttsUsd = (params.ttsChars / 1_000_000) * PDF_TTS_COST_PER_1M_CHARS;
  return {
    estimatedCostUsd: scriptUsd + ttsUsd,
    estimatedCostBreakdown: {
      scriptUsd,
      ttsUsd,
      scriptInputTokensApprox,
      scriptOutputTokensApprox,
      ttsChars: params.ttsChars,
    },
  };
}

async function generatePdfAudio(params: {
  userId: string;
  apiKey: string;
  fileBuffer: Buffer;
  mode: PdfAudioMode;
  voice: string;
  secondaryVoice: string;
  targetMinutes: number;
  includeBase64Fallback: boolean;
  onProgress?: (stage: string, progress: number) => void;
}): Promise<PdfAudioResult> {
  const {
    userId,
    apiKey,
    fileBuffer,
    mode,
    voice,
    secondaryVoice,
    targetMinutes,
    includeBase64Fallback,
    onProgress,
  } = params;

  onProgress?.('Extracting text', 8);
  const pdfText = await extractPdfText(fileBuffer);
  const chunks = chunkTextByParagraph(pdfText);
  if (!chunks.length) throw new Error('PDF text extraction returned no content');

  const targetCharsTotal = targetMinutes * 750;
  const hardCap = mode === 'podcast' ? 18 : 24;
  const suggestedChunkCount = Math.max(1, Math.ceil(targetCharsTotal / (mode === 'summary' ? 950 : 1400)));
  const activeChunks = chunks.slice(0, Math.min(chunks.length, Math.min(hardCap, suggestedChunkCount)));
  const targetCharsPerChunk = Math.max(
    mode === 'summary' ? 420 : 700,
    Math.ceil(targetCharsTotal / Math.max(1, activeChunks.length))
  );

  onProgress?.('Generating script', 15);
  const scriptChunks: string[] = [];
  let prevTail = '';
  let scriptInputChars = 0;
  for (let i = 0; i < activeChunks.length; i++) {
    scriptInputChars += activeChunks[i].length;
    const script = await generateScriptChunk(
      apiKey,
      mode,
      activeChunks[i],
      i,
      activeChunks.length,
      prevTail,
      targetCharsPerChunk,
    );
    scriptChunks.push(script);
    prevTail = script.slice(Math.max(0, script.length - 260));
    onProgress?.('Generating script', 15 + Math.floor(((i + 1) / activeChunks.length) * 35));
  }

  const script = scriptChunks.join('\n\n');
  const pcmParts: Buffer[] = [];
  const gapMs = mode === 'podcast' ? 220 : 160;
  const gapSamples = Math.floor((24000 * gapMs) / 1000);
  const silence = Buffer.alloc(gapSamples * 2, 0);
  let ttsChars = 0;
  onProgress?.('Synthesizing audio', 52);

  if (mode === 'podcast') {
    const turns = parsePodcastTurns(script);
    let processed = 0;
    const total = Math.max(1, turns.length);
    for (const turn of turns) {
      const ttsVoice = turn.speaker === 'guest' ? secondaryVoice : voice;
      const subParts = chunkLongSpeech(turn.text, 1300);
      for (const subPart of subParts) {
        ttsChars += subPart.length;
        const pcm = await synthesizePcm(apiKey, subPart, ttsVoice);
        pcmParts.push(pcm, silence);
      }
      processed++;
      onProgress?.('Synthesizing audio', 52 + Math.floor((processed / total) * 33));
    }
  } else {
    for (let i = 0; i < scriptChunks.length; i++) {
      ttsChars += scriptChunks[i].length;
      const pcm = await synthesizePcm(apiKey, scriptChunks[i], voice);
      pcmParts.push(pcm, silence);
      onProgress?.('Synthesizing audio', 52 + Math.floor(((i + 1) / scriptChunks.length) * 33));
    }
  }

  const pcmData = Buffer.concat(pcmParts);
  const wav = Buffer.concat([makeWavHeader(pcmData.length), pcmData]);
  const durationSeconds = estimateDurationSecondsFromPcmBytes(pcmData.length);
  const cost = estimatePdfAudioCost({
    scriptInputChars,
    scriptOutputChars: script.length,
    ttsChars,
  });

  onProgress?.('Uploading audio', 90);
  let audioUrl = '';
  try {
    const fileName = `${userId}/${crypto.randomUUID()}-${mode}.wav`;
    const { error } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, wav, { contentType: 'audio/wav', upsert: false });
    if (!error) {
      const { data: signedData, error: signedErr } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(fileName, 60 * 60 * 24); // 24h
      if (!signedErr && signedData?.signedUrl) {
        audioUrl = signedData.signedUrl;
      } else {
        const { data } = supabase.storage.from('chat-attachments').getPublicUrl(fileName);
        audioUrl = data.publicUrl;
      }
    }
  } catch (storageErr) {
    console.warn('[pdf-podcast] Storage upload failed:', storageErr);
  }

  if (!audioUrl && !includeBase64Fallback) {
    throw new Error('Audio upload failed. Please try again in a moment.');
  }

  onProgress?.('Done', 100);
  return {
    mode,
    chunks: activeChunks.length,
    scriptPreview: script.slice(0, 2000),
    audioUrl,
    ...(audioUrl || !includeBase64Fallback ? {} : { audioBase64: wav.toString('base64') }),
    mimeType: 'audio/wav',
    durationSeconds,
    estimatedCostUsd: cost.estimatedCostUsd,
    estimatedCostBreakdown: cost.estimatedCostBreakdown,
    targetMinutes,
  };
}

// ── POST /api/audio/transcribe — Speech-to-Text ────────────────────
router.post('/transcribe', authMiddleware, upload.single('audio'), async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });

  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No audio file provided' });

  try {
    // Build form data for OpenAI Whisper API
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname || 'recording.webm',
      contentType: file.mimetype || 'audio/webm',
    });
    formData.append('model', 'gpt-4o-mini-transcribe');

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...formData.getHeaders(),
        },
        maxContentLength: 30 * 1024 * 1024,
      }
    );

    const text = (response.data as any)?.text?.trim() || '';
    console.log(`[audio/transcribe] Transcribed ${text.length} chars`);
    res.json({ text });
  } catch (error: any) {
    console.error('Transcription error:', error?.response?.data || error.message);
    const msg = error?.response?.data?.error?.message || error.message || 'Transcription failed';
    res.status(500).json({ error: msg });
  }
});

// ── POST /api/audio/speech — Text-to-Speech ────────────────────────
router.post('/speech', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });

  const { text, voice = 'nova' } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Missing text' });
  }

  // Truncate to 4096 chars for TTS
  const truncated = text.trim().substring(0, 4096);

  const validVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'];
  const selectedVoice = validVoices.includes(voice) ? voice : 'nova';

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/audio/speech',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: 'gpt-4o-mini-tts',
        input: truncated,
        voice: selectedVoice,
        response_format: 'mp3',
      },
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    response.data.pipe(res);
  } catch (error: any) {
    console.error('TTS error:', error?.response?.data || error.message);
    const msg = error?.response?.data?.error?.message || error.message || 'Speech generation failed';
    if (!res.headersSent) {
      res.status(500).json({ error: msg });
    }
  }
});

export { router as audioRoutes };

// ── POST /api/audio/pdf-podcast — PDF -> summary/narration/podcast audio ──
router.post('/pdf-podcast', authMiddleware, upload.single('pdf'), async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });

  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No PDF provided' });
  if (file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Only PDF is supported' });

  const mode = (req.body?.mode || 'summary') as PdfAudioMode;
  if (!['summary', 'narration', 'podcast'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  const primaryVoice = TTS_VOICES.includes(req.body?.voice) ? req.body.voice : 'nova';
  const secondaryVoice = TTS_VOICES.includes(req.body?.secondaryVoice) ? req.body.secondaryVoice : 'ash';
  const targetMinutes = parseTargetMinutes(req.body?.targetMinutes, mode);

  try {
    const result = await generatePdfAudio({
      userId,
      apiKey,
      fileBuffer: file.buffer,
      mode,
      voice: primaryVoice,
      secondaryVoice,
      targetMinutes,
      includeBase64Fallback: true,
    });
    return res.json(result);
  } catch (error: any) {
    console.error('[pdf-podcast] generation error:', error?.response?.data || error?.message || error);
    return res.status(500).json({ error: error?.message || 'PDF audio generation failed' });
  }
});

router.post('/pdf-podcast/jobs', authMiddleware, upload.single('pdf'), async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });

  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No PDF provided' });
  if (file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Only PDF is supported' });

  const mode = (req.body?.mode || 'summary') as PdfAudioMode;
  if (!['summary', 'narration', 'podcast'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  const voice = TTS_VOICES.includes(req.body?.voice) ? req.body.voice : 'nova';
  const secondaryVoice = TTS_VOICES.includes(req.body?.secondaryVoice) ? req.body.secondaryVoice : 'ash';
  const targetMinutes = parseTargetMinutes(req.body?.targetMinutes, mode);
  const conversationId = typeof req.body?.conversationId === 'string' ? req.body.conversationId : undefined;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const job: PdfAudioJob = {
    id,
    userId,
    status: 'queued',
    mode,
    voice,
    secondaryVoice,
    targetMinutes,
    fileName: file.originalname || 'document.pdf',
    conversationId,
    progress: 0,
    stage: 'Queued',
    createdAt: now,
    updatedAt: now,
  };
  pdfAudioJobs.set(id, job);
  prunePdfAudioJobs();

  void (async () => {
    try {
      const existing = pdfAudioJobs.get(id);
      if (!existing) return;
      existing.status = 'processing';
      existing.stage = 'Starting';
      existing.progress = 3;
      existing.updatedAt = new Date().toISOString();
      pdfAudioJobs.set(id, existing);

      const result = await generatePdfAudio({
        userId,
        apiKey,
        fileBuffer: file.buffer,
        mode,
        voice,
        secondaryVoice,
        targetMinutes,
        includeBase64Fallback: false,
        onProgress: (stage, progress) => {
          const running = pdfAudioJobs.get(id);
          if (!running) return;
          running.status = 'processing';
          running.stage = stage;
          running.progress = Math.max(0, Math.min(100, progress));
          running.updatedAt = new Date().toISOString();
          pdfAudioJobs.set(id, running);
        },
      });

      const done = pdfAudioJobs.get(id);
      if (!done) return;
      done.status = 'completed';
      done.stage = 'Completed';
      done.progress = 100;
      done.result = result;
      done.updatedAt = new Date().toISOString();
      pdfAudioJobs.set(id, done);

      if (done.conversationId) {
        const info = `Generated ${result.mode} audio from **${done.fileName}** (${result.chunks} chunks, ~${Math.round(result.durationSeconds / 60)} min target ${result.targetMinutes}m).\n\nEstimated generation cost: **$${result.estimatedCostUsd.toFixed(4)}**.\n\n[Open / Download audio](${result.audioUrl})`;
        const dbAttachments = [
          {
            id: `pdf-audio-${id}`,
            type: 'audio',
            mimeType: result.mimeType,
            fileName: `${done.fileName.replace(/\.pdf$/i, '') || 'generated'}-${result.mode}.wav`,
            url: result.audioUrl,
            size: 0,
          },
        ];
        try {
          await saveConversationMessage(
            done.userId,
            done.conversationId,
            'assistant',
            info,
            'pdf-audio-generator',
            0,
            result.estimatedCostUsd,
            dbAttachments,
          );
        } catch (saveErr) {
          console.warn('[pdf-podcast-job] Failed to persist completion message:', saveErr);
        }
      }
    } catch (err: any) {
      const failed = pdfAudioJobs.get(id);
      if (!failed) return;
      failed.status = 'failed';
      failed.stage = 'Failed';
      failed.progress = 100;
      failed.error = err?.message || 'PDF audio generation failed';
      failed.updatedAt = new Date().toISOString();
      pdfAudioJobs.set(id, failed);
      console.error('[pdf-podcast-job] generation error:', err?.response?.data || err?.message || err);
    }
  })();

  return res.json({ job });
});

router.get('/pdf-podcast/jobs', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const jobs = [...pdfAudioJobs.values()]
    .filter(j => j.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30);

  return res.json({ jobs });
});

router.get('/pdf-podcast/jobs/:jobId', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const job = pdfAudioJobs.get(req.params.jobId);
  if (!job || job.userId !== userId) return res.status(404).json({ error: 'Job not found' });
  return res.json({ job });
});
