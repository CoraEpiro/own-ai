import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../config';

const router = express.Router();
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv', 'text/markdown',
  'application/json',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
  },
});

// Extract text from PDF buffer
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse options for better extraction
    const options = {
      // Max pages to prevent hanging on huge PDFs
      max: 50,
    };
    const result = await pdfParse(buffer, options);
    const text = (result.text || '').trim();

    if (!text) {
      // Check if the PDF has pages but no text (likely scanned/image-based)
      const pageCount = result.numpages || 0;
      if (pageCount > 0) {
        return `[This PDF has ${pageCount} page${pageCount > 1 ? 's' : ''} but contains no extractable text. It may be a scanned document or image-based PDF. Please describe what you see in the document, or try uploading it as an image instead.]`;
      }
      return '[PDF contained no extractable text]';
    }

    // Clean up extracted text: normalize whitespace, remove excessive blank lines
    const cleaned = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    console.log(`PDF extracted: ${cleaned.length} chars from ${result.numpages} pages`);

    // Truncate very large PDFs to prevent token limits
    if (cleaned.length > 50000) {
      return cleaned.substring(0, 50000) + '\n\n[... PDF text truncated at 50,000 characters]';
    }

    return cleaned;
  } catch (err: any) {
    console.error('PDF extraction failed:', err?.message || err);
    // Provide helpful error message
    if (err?.message?.includes('encrypted') || err?.message?.includes('password')) {
      return '[This PDF is password-protected and cannot be read. Please remove the password and try again.]';
    }
    return '[Could not extract text from this PDF. It may be corrupted or in an unsupported format.]';
  }
}

// Extract text from text-based files
function extractTextContent(buffer: Buffer, mimeType: string, fileName: string): string {
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    const text = buffer.toString('utf-8').trim();
    if (!text) return '[File is empty]';
    // Truncate very large text files
    if (text.length > 100000) {
      return text.substring(0, 100000) + '\n\n[... text truncated at 100,000 characters]';
    }
    return text;
  }
  return '';
}

// POST /api/upload — Upload files and extract content
router.post('/', authMiddleware, upload.array('files', 5), async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: 'No files provided' });

  try {
    const results = await Promise.all(
      files.map(async (file) => {
        const ext = file.originalname.split('.').pop() || 'bin';
        const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;

        // Try uploading to Supabase Storage (non-blocking — if it fails, we still process the file)
        let publicUrl = '';
        try {
          const { error } = await supabase.storage
            .from('chat-attachments')
            .upload(storagePath, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            });

          if (!error) {
            const { data: urlData } = supabase.storage
              .from('chat-attachments')
              .getPublicUrl(storagePath);
            publicUrl = urlData.publicUrl;
          } else {
            console.warn('Storage upload skipped:', error.message);
          }
        } catch (storageErr) {
          console.warn('Storage upload error (continuing):', storageErr);
        }

        const isImage = file.mimetype.startsWith('image/');
        const isPdf = file.mimetype === 'application/pdf';
        const isText = file.mimetype.startsWith('text/') || file.mimetype === 'application/json';

        // Extract content based on file type
        let extractedText = '';
        let base64 = '';

        if (isImage) {
          base64 = file.buffer.toString('base64');
        } else if (isPdf) {
          // Always include base64 for PDFs so they can be sent to vision/document APIs
          base64 = file.buffer.toString('base64');
          extractedText = await extractPdfText(file.buffer);
        } else if (isText) {
          extractedText = extractTextContent(file.buffer, file.mimetype, file.originalname);
        }

        return {
          id: crypto.randomUUID(),
          type: isImage ? 'image' as const : 'document' as const,
          mimeType: file.mimetype,
          fileName: file.originalname,
          url: publicUrl,
          storagePath,
          size: file.size,
          ...(base64 ? { base64 } : {}),
          ...(extractedText ? { extractedText } : {}),
        };
      })
    );

    console.log(`Upload complete: ${results.length} files processed`);
    results.forEach(r => console.log(`  → ${r.fileName} (${r.type}) extractedText: ${r.extractedText ? r.extractedText.length + ' chars' : 'none'}, base64: ${r.base64 ? 'yes' : 'no'}`));
    res.json({ attachments: results });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

export { router as uploadRoutes };
