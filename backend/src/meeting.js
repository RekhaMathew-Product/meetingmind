import { Router } from 'express';
import { session, resetSession } from './state.js';
import { joinMeeting, leaveBot } from './recallai.js';
import { startPolling, generateMeetingSummary } from './polling.js';
import { broadcastEvent } from './webhook.js';
import { clearContextCache } from './contextDetector.js';

export const meetingRouter = Router();

/**
 * POST /api/meeting/start
 * Body: { meetingUrl: string, agenda: [{ item: string, minutes: number }] }
 */
meetingRouter.post('/start', async (req, res) => {
  const { meetingUrl, agenda } = req.body;

  if (!meetingUrl || !Array.isArray(agenda) || agenda.length === 0) {
    return res.status(400).json({ error: 'meetingUrl and agenda[] are required' });
  }

  if (session.status === 'live') {
    return res.status(409).json({ error: 'A meeting is already in progress' });
  }

  const webhookUrl = `${process.env.PUBLIC_BASE_URL}/webhook/recall`;

  try {
    // Full reset so no state bleeds in from a previous meeting
    resetSession();
    clearContextCache();

    const bot = await joinMeeting(meetingUrl, webhookUrl);

    Object.assign(session, {
      botId: bot.id,
      meetingUrl,
      agenda,
      currentItemIndex: 0,
      itemStartedAt: new Date(),
      status: 'live',
    });

    startPolling();
    broadcastEvent('meeting_started', { botId: bot.id, agenda });

    console.log(`[Meeting] Started — bot ${bot.id} joined ${meetingUrl}`);
    res.json({ botId: bot.id, agenda });
  } catch (err) {
    console.error('[Meeting] Start failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/meeting/next-item
 * Advance to the next agenda item.
 */
meetingRouter.post('/next-item', (req, res) => {
  if (session.status !== 'live') {
    return res.status(400).json({ error: 'No active meeting' });
  }

  session.currentItemIndex = Math.min(
    session.currentItemIndex + 1,
    session.agenda.length - 1
  );
  session.itemStartedAt = new Date();
  session.alertCooldownUntil = null;

  const item = session.agenda[session.currentItemIndex];
  broadcastEvent('item_advanced', { index: session.currentItemIndex, item });
  res.json({ index: session.currentItemIndex, item });
});

/**
 * POST /api/meeting/end
 * End the meeting — generate summary, remove bot.
 */
meetingRouter.post('/end', async (req, res) => {
  if (session.status !== 'live') {
    return res.status(400).json({ error: 'No active meeting' });
  }

  session.status = 'ended';
  if (session.pollIntervalId) {
    clearInterval(session.pollIntervalId);
    session.pollIntervalId = null;
  }

  try {
    const summary = await generateMeetingSummary();
    const botId = session.botId;

    if (botId) {
      await leaveBot(botId);
    }

    res.json({ summary });
  } catch (err) {
    console.error('[Meeting] End error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/meeting/status
 */
meetingRouter.get('/status', (req, res) => {
  res.json({
    status: session.status,
    botId: session.botId,
    agenda: session.agenda,
    currentItemIndex: session.currentItemIndex,
    summary: session.summary,
  });
});
