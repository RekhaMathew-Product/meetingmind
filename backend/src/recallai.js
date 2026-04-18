import fetch from 'node-fetch';

const BASE = process.env.RECALL_API_BASE || 'https://api.recall.ai/api/v1';
const KEY = process.env.RECALL_API_KEY;

function headers() {
  return {
    'Authorization': `Token ${KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create and send a bot to the given Google Meet URL.
 * Returns the bot object (includes bot.id).
 */
export async function joinMeeting(meetingUrl, webhookUrl) {
  const res = await fetch(`${BASE}/bot`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      meeting_url: meetingUrl,
      bot_name: 'MeetingMind AI',
      transcription_options: { provider: 'assembly_ai' },
      real_time_transcription: {
        destination_url: webhookUrl,
        partial_results: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Recall joinMeeting failed: ${res.status} — ${err}`);
  }

  return res.json();
}

/**
 * Make the bot speak an audio clip into the call.
 * audioUrl must be publicly reachable.
 */
export async function botSpeak(botId, audioUrl) {
  const res = await fetch(`${BASE}/bot/${botId}/speak`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ audio_url: audioUrl }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Recall botSpeak failed: ${res.status} — ${err}`);
  }
}

/**
 * Gracefully remove the bot from the meeting.
 */
export async function leaveBot(botId) {
  const res = await fetch(`${BASE}/bot/${botId}/leave_call`, {
    method: 'POST',
    headers: headers(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Recall leaveBot failed: ${res.status} — ${err}`);
  }
}
