import { Router } from 'express';
import { session, appendTranscript } from './state.js';

export const webhookRouter = Router();

// SSE clients for real-time frontend updates
const sseClients = new Set();

export function broadcastEvent(type, data) {
  const payload = `data: ${JSON.stringify({ type, data, ts: Date.now() })}\n\n`;
  for (const res of sseClients) {
    res.write(payload);
  }
}

// SSE endpoint — frontend subscribes here
webhookRouter.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current session state immediately on connect
  res.write(`data: ${JSON.stringify({ type: 'init', data: { status: session.status, agenda: session.agenda }, ts: Date.now() })}\n\n`);

  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

/**
 * Recall.ai transcript webhook.
 * Recall POSTs transcript segments here in real time.
 */
webhookRouter.post('/recall', (req, res) => {
  const body = req.body;

  // Recall.ai real_time_transcription payload shape
  if (body?.data?.transcript) {
    const words = body.data.transcript;
    const speaker = body.data.speaker?.name || 'Participant';
    const text = words.map(w => w.text).join(' ').trim();

    if (text) {
      appendTranscript(speaker, text);
      broadcastEvent('transcript', { speaker, text, ts: Date.now() });
    }
  }

  // Bot joined / left events
  if (body?.event === 'bot.status_change') {
    const status = body?.data?.status?.code;
    console.log(`[Webhook] Bot status: ${status}`);
    broadcastEvent('bot_status', { status });
  }

  res.sendStatus(200);
});
