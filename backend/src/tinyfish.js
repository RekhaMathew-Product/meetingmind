import fetch from 'node-fetch';

const BASE = process.env.TINYFISH_API_BASE || 'https://api.tinyfish.ai/v1';
const KEY = process.env.TINYFISH_API_KEY;

function headers() {
  return {
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Check whether the last N words of transcript are on-topic.
 * Returns { status: 'ON_TOPIC'|'DIGRESSING', confidence: 0-100, reason: string }
 */
export async function checkAgendaAdherence(agendaItem, transcriptSnippet) {
  const prompt = `You are a meeting facilitator assistant. Determine if the conversation is on-topic.

Current agenda item: "${agendaItem}"

Last 45 seconds of transcript:
${transcriptSnippet}

Reply with ONLY valid JSON — no markdown, no explanation:
{"status":"ON_TOPIC"|"DIGRESSING","confidence":0-100,"reason":"one sentence"}`;

  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: 'tinyfish-1',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 100,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TinyFish adherence check failed: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  return JSON.parse(content);
}

/**
 * Generate end-of-meeting summary.
 * Returns { decisions: string[], actionItems: [{item,owner}], efficiencyScore: number, suggestions: string[] }
 */
export async function generateSummary(agendaItems, fullTranscript) {
  const agendaText = agendaItems.map((a, i) => `${i + 1}. ${a.item} (${a.minutes} min)`).join('\n');

  const prompt = `You are a meeting facilitator. Analyze this meeting and provide a structured summary.

Agenda:
${agendaText}

Full transcript:
${fullTranscript}

Reply with ONLY valid JSON — no markdown:
{
  "decisions": ["decision 1", "decision 2"],
  "actionItems": [{"item": "task description", "owner": "speaker name or TBD"}],
  "efficiencyScore": 0-100,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "voiceSummary": "A 2-3 sentence spoken summary of the meeting outcomes."
}`;

  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: 'tinyfish-1',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TinyFish summary failed: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  return JSON.parse(content);
}
