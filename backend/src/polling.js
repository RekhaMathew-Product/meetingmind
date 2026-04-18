import { session, lastNWords, currentAgendaItem, secondsOnCurrentItem } from './state.js';
import { checkAgendaAdherence, generateSummary } from './tinyfish.js';
import { generateSpeech } from './gradium.js';
import { botSpeak } from './recallai.js';
import { broadcastEvent } from './webhook.js';

const POLL_INTERVAL_MS = 30_000;      // 30 seconds
const DIGRESSION_THRESHOLD_S = 60;    // 60s of digression before alerting
const COOLDOWN_MS = 3 * 60 * 1000;    // 3-minute cooldown between alerts
const OVERTIME_BUFFER_S = 120;        // 2 minutes over budget triggers timekeeper

export function startPolling() {
  console.log('[Polling] Started — checking every 30s');
  session.pollIntervalId = setInterval(runPollCycle, POLL_INTERVAL_MS);
}

async function runPollCycle() {
  if (session.status !== 'live') return;

  const item = currentAgendaItem();
  if (!item) return;

  const snippet = lastNWords(200);
  if (!snippet.trim()) return;

  // --- P1: Structure enforcer ---
  try {
    const result = await checkAgendaAdherence(item.item, snippet);
    console.log(`[Poll] Agenda check: ${result.status} (${result.confidence}%) — ${result.reason}`);

    broadcastEvent('agenda_check', { ...result, agendaItem: item.item });

    if (result.status === 'DIGRESSING') {
      session.consecutiveDigressions++;
    } else {
      session.consecutiveDigressions = 0;
    }

    const cooldownPassed = !session.alertCooldownUntil || Date.now() > session.alertCooldownUntil;

    if (session.consecutiveDigressions >= 2 && cooldownPassed) {
      const text = `Quick heads-up — we've drifted from ${item.item} for about a minute. Let's try to bring it back on track.`;
      await fireVoiceAlert(text, 'digression');
      session.consecutiveDigressions = 0;
    }
  } catch (err) {
    console.error('[Poll] Agenda check error:', err.message);
  }

  // --- P2: Timekeeper ---
  const secondsElapsed = secondsOnCurrentItem();
  const budgetSeconds = (item.minutes || 5) * 60;
  const overBy = secondsElapsed - budgetSeconds;

  if (overBy > OVERTIME_BUFFER_S) {
    const overMin = Math.floor(overBy / 60);
    const cooldownPassed = !session.alertCooldownUntil || Date.now() > session.alertCooldownUntil;
    if (cooldownPassed) {
      const text = `${item.item} is ${overMin} minute${overMin !== 1 ? 's' : ''} over. Shall we wrap up or defer the rest?`;
      await fireVoiceAlert(text, 'overtime');
    }
  }

  broadcastEvent('timer_update', {
    agendaItem: item.item,
    secondsElapsed,
    budgetSeconds,
    currentItemIndex: session.currentItemIndex,
  });
}

async function fireVoiceAlert(text, type) {
  console.log(`[Alert][${type}] "${text}"`);
  try {
    const audioUrl = await generateSpeech(text);
    await botSpeak(session.botId, audioUrl);
    session.alertCooldownUntil = Date.now() + COOLDOWN_MS;
    broadcastEvent('voice_alert', { type, text, audioUrl });
  } catch (err) {
    console.error(`[Alert] Failed to fire ${type} alert:`, err.message);
  }
}

/**
 * Called when the meeting ends. Generates P3 summary + P4 suggestions.
 */
export async function generateMeetingSummary() {
  const fullTranscript = session.transcriptBuffer
    .map(e => `${e.speaker}: ${e.text}`)
    .join('\n');

  try {
    const summary = await generateSummary(session.agenda, fullTranscript);
    session.summary = summary;
    broadcastEvent('meeting_summary', summary);

    // Speak summary into the call
    if (session.botId && summary.voiceSummary) {
      const audioUrl = await generateSpeech(summary.voiceSummary);
      await botSpeak(session.botId, audioUrl);
    }

    return summary;
  } catch (err) {
    console.error('[Summary] Failed:', err.message);
    throw err;
  }
}
