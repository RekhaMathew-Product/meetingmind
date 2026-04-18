import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { webhookRouter } from './webhook.js';
import { meetingRouter } from './meeting.js';
import { audioRouter } from './audio.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve generated audio files
app.use('/audio', audioRouter);

// Recall.ai webhook receiver
app.use('/webhook', webhookRouter);

// Meeting control API (start/end meeting, set agenda)
app.use('/api/meeting', meetingRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`MeetingMind backend running on http://localhost:${PORT}`);
});
