import { Router } from 'express';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.resolve(__dirname, '../../audio');

export const audioRouter = Router();

// Serve generated audio files by name
audioRouter.get('/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filepath = path.join(AUDIO_DIR, filename);

  if (!existsSync(filepath)) {
    return res.status(404).json({ error: 'Audio file not found' });
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  createReadStream(filepath).pipe(res);
});
