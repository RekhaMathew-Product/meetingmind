import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const BASE = process.env.GRADIUM_API_BASE || 'https://api.gradium.ai/v1';
const KEY = process.env.GRADIUM_API_KEY;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';
// Set GRADIUM_VOICE_ID in .env once you confirm the voice ID from https://gradium.ai/docs
const VOICE_ID = process.env.GRADIUM_VOICE_ID || 'default';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, '../../audio');

// Ensure audio output directory exists
fs.mkdirSync(AUDIO_DIR, { recursive: true });

/**
 * Generate speech audio from text via Gradium TTS.
 * Saves the file locally and returns the public URL for Recall to fetch.
 */
export async function generateSpeech(text) {
  const res = await fetch(`${BASE}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      voice: VOICE_ID,
      model: 'gradium-tts-1',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gradium TTS failed: ${res.status} — ${err}`);
  }

  const audioBuffer = Buffer.from(await res.arrayBuffer());
  const filename = `alert-${uuidv4()}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filepath, audioBuffer);

  const publicUrl = `${PUBLIC_BASE_URL}/audio/${filename}`;
  console.log(`[Gradium] Audio saved → ${publicUrl}`);
  return publicUrl;
}
