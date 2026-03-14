import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

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
