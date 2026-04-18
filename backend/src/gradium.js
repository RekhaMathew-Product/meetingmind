import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Correct base: https://api.gradium.ai/api  (not /v1)
const BASE = 'https://api.gradium.ai/api';
const KEY = process.env.GRADIUM_API_KEY;
const VOICE_ID = process.env.GRADIUM_VOICE_ID || 'default';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, '../../audio');

fs.mkdirSync(AUDIO_DIR, { recursive: true });

/**
 * Generate speech via Gradium TTS POST endpoint.
 * Docs: https://docs.gradium.ai/api-reference/introduction
 *
 * POST /api/post/speech/tts
 * Auth: x-api-key header
 * Returns raw audio bytes when only_audio=true
 */
export async function generateSpeech(text) {
  console.log(`[Gradium] Generating speech for: "${text.slice(0, 60)}..."`);

  const res = await fetch(`${BASE}/post/speech/tts`, {
    method: 'POST',
    headers: {
      'x-api-key': KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice_id: VOICE_ID,
      output_format: 'wav',
      only_audio: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gradium TTS failed: ${res.status} — ${err}`);
  }

  const audioBuffer = Buffer.from(await res.arrayBuffer());
  console.log(`[Gradium] Audio buffer size: ${audioBuffer.length} bytes`);

  if (audioBuffer.length < 1000) {
    throw new Error(`Gradium returned suspiciously small audio (${audioBuffer.length} bytes) — likely an error response`);
  }

  const filename = `alert-${uuidv4()}.wav`;
  const filepath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filepath, audioBuffer);

  const publicUrl = `${PUBLIC_BASE_URL}/audio/${filename}`;
  console.log(`[Gradium] Audio saved → ${publicUrl} (${audioBuffer.length} bytes)`);
  return publicUrl;
}
