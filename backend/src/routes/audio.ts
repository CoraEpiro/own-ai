import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../config';

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

async function generateScriptChunk(
  apiKey: string,
  mode: PdfAudioMode,
  chunk: string,
  index: number,
  total: number,
  previousTail: string,
): Promise<string> {
  const modeInstruction: Record<PdfAudioMode, string> = {
    summary: 'Create a concise spoken summary section. Focus on key points only.',
    narration: 'Create natural narration suitable for listening. Keep flow and clarity.',
    podcast: 'Create a podcast-style dialogue with "Host:" and "Guest:" lines only.',
  };

  const prompt = [
    `${modeInstruction[mode]}`,
    `This is chunk ${index + 1} of ${total}.`,
    previousTail ? `Previous chunk tail for continuity:\n${previousTail}` : '',
    'Use plain spoken language. No markdown. No bullet lists unless naturally spoken.',
    'Source chunk:',
    chunk,
  ].filter(Boolean).join('\n\n');

  const resp = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: 'You are an expert script writer for spoken audio content.' },
        { role: 'user', content: prompt },
      ],
      max_completion_tokens: 900,
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    },
  );

  return sanitizeSpeechText(resp.data?.choices?.[0]?.message?.content || '');
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
    },
  );
  return Buffer.from(resp.data);
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

  try {
    const pdfText = await extractPdfText(file.buffer);
    const chunks = chunkTextByParagraph(pdfText);
    if (!chunks.length) return res.status(400).json({ error: 'PDF text extraction returned no content' });

    const scriptChunks: string[] = [];
    let prevTail = '';
    for (let i = 0; i < chunks.length; i++) {
      const script = await generateScriptChunk(apiKey, mode, chunks[i], i, chunks.length, prevTail);
      scriptChunks.push(script);
      prevTail = script.slice(Math.max(0, script.length - 260));
    }

    const script = scriptChunks.join('\n\n');

    const pcmParts: Buffer[] = [];
    const gapMs = mode === 'podcast' ? 220 : 160;
    const gapSamples = Math.floor((24000 * gapMs) / 1000);
    const silence = Buffer.alloc(gapSamples * 2, 0);

    if (mode === 'podcast') {
      const lines = script
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      for (const line of lines) {
        const isGuest = /^guest\s*:/i.test(line);
        const text = line.replace(/^(host|guest)\s*:\s*/i, '').trim();
        if (!text) continue;
        const pcm = await synthesizePcm(apiKey, text, isGuest ? secondaryVoice : primaryVoice);
        pcmParts.push(pcm, silence);
      }
    } else {
      for (const part of scriptChunks) {
        const pcm = await synthesizePcm(apiKey, part, primaryVoice);
        pcmParts.push(pcm, silence);
      }
    }

    const pcmData = Buffer.concat(pcmParts);
    const wav = Buffer.concat([makeWavHeader(pcmData.length), pcmData]);

    let audioUrl = '';
    try {
      const fileName = `${userId}/${crypto.randomUUID()}-${mode}.wav`;
      const { error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, wav, { contentType: 'audio/wav', upsert: false });
      if (!error) {
        const { data } = supabase.storage.from('chat-attachments').getPublicUrl(fileName);
        audioUrl = data.publicUrl;
      }
    } catch (storageErr) {
      console.warn('[pdf-podcast] Storage upload failed, falling back to base64 payload:', storageErr);
    }

    return res.json({
      mode,
      chunks: chunks.length,
      scriptPreview: script.slice(0, 2000),
      audioUrl,
      ...(audioUrl ? {} : { audioBase64: wav.toString('base64') }),
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('[pdf-podcast] generation error:', error?.response?.data || error?.message || error);
    return res.status(500).json({ error: error?.message || 'PDF audio generation failed' });
  }
});
