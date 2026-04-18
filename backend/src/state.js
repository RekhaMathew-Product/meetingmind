/**
 * In-memory session state for the active meeting.
 * Single-meeting hackathon scope — no DB needed.
 */
export const session = {
  botId: null,
  meetingUrl: null,
  agenda: [],          // [{ item: string, minutes: number }]
  currentItemIndex: 0,
  itemStartedAt: null, // Date
  transcriptBuffer: [],// [{ speaker: string, text: string, ts: number }]
  status: 'idle',      // idle | live | ended
  pollIntervalId: null,
  alertCooldownUntil: null,
  summary: null,
};

export function resetSession() {
  if (session.pollIntervalId) clearInterval(session.pollIntervalId);
  Object.assign(session, {
    botId: null,
    meetingUrl: null,
    agenda: [],
    currentItemIndex: 0,
    itemStartedAt: null,
    transcriptBuffer: [],
    status: 'idle',
    pollIntervalId: null,
    alertCooldownUntil: null,
    summary: null,
  });
}

export function appendTranscript(speaker, text) {
  session.transcriptBuffer.push({ speaker, text, ts: Date.now() });
  // Keep last 500 entries to bound memory
  if (session.transcriptBuffer.length > 500) {
    session.transcriptBuffer.shift();
  }
}

export function lastNWords(n) {
  const words = session.transcriptBuffer
    .map(e => `${e.speaker}: ${e.text}`)
    .join(' ')
    .split(/\s+/);
  return words.slice(-n).join(' ');
}

export function currentAgendaItem() {
  return session.agenda[session.currentItemIndex] || null;
}

export function secondsOnCurrentItem() {
  if (!session.itemStartedAt) return 0;
  return Math.floor((Date.now() - session.itemStartedAt) / 1000);
}
