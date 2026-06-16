import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// POST /upload — upload a file to Supabase Storage
router.post('/upload', verifyJWT, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { listing_id, type } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: 'No file provided' });
      return;
    }

    if (!['image', 'video', 'document'].includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid type. Must be image, video, or document' });
      return;
    }

    const folder = listing_id ? `listings/${listing_id}/${type}` : `general/${type}`;
    const filename = `${uuidv4()}-${file.originalname}`;
    const path = `${folder}/${filename}`;

    const { data, error } = await supabase.storage
      .from('landconnect-media')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      res.status(500).json({ success: false, error: 'Failed to upload file to storage' });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('landconnect-media').getPublicUrl(path);

    res.status(201).json({ success: true, data: { url: publicUrl, path } });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /signed-url — get a signed URL for a private file
router.get('/signed-url', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { path } = req.query;

    if (!path || typeof path !== 'string') {
      res.status(400).json({ success: false, error: 'File path required' });
      return;
    }

    const { data, error } = await supabase.storage
      .from('landconnect-media')
      .createSignedUrl(path, 60 * 60); // 1 hour

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to generate signed URL' });
      return;
    }

    res.json({ success: true, data: { signedUrl: data.signedUrl } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
