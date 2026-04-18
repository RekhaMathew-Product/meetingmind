/**
 * LLM reasoning via Claude API (Anthropic).
 * Handles agenda adherence checks and end-of-meeting summary generation —
 * the roles originally described as "TinyFish LLM" in the PRD.
 */
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-haiku-4-5-20251001'; // Fast + cheap for real-time polling

/**
 * Check whether the transcript is on-topic for the current agenda item.
 * Called every 30s by the polling loop.
 *
 * @returns {{ status: 'ON_TOPIC'|'DIGRESSING', confidence: number, reason: string }}
 */
export async function checkAgendaAdherence(agendaItem, transcriptSnippet) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 120,
    messages: [{
      role: 'user',
      content: `You are a meeting facilitator. Determine if this conversation is on-topic.

Current agenda item: "${agendaItem}"

Last 45 seconds of transcript:
${transcriptSnippet}

Reply with ONLY valid JSON — no markdown, no explanation:
{"status":"ON_TOPIC","confidence":85,"reason":"one sentence explanation"}

status must be exactly "ON_TOPIC" or "DIGRESSING".`,
    }],
  });

  const content = message.content[0]?.text?.trim();
  return JSON.parse(content);
}

/**
 * Generate end-of-meeting summary with decisions, action items, and efficiency score.
 *
 * @returns {{ decisions, actionItems, efficiencyScore, suggestions, voiceSummary }}
 */
export async function generateSummary(agendaItems, fullTranscript) {
  const agendaText = agendaItems
    .map((a, i) => `${i + 1}. ${a.item} (${a.minutes} min)`)
    .join('\n');

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 700,
    messages: [{
      role: 'user',
      content: `You are a meeting facilitator. Analyze this meeting and produce a structured summary.

Agenda:
${agendaText}

Full transcript:
${fullTranscript}

Reply with ONLY valid JSON — no markdown:
{
  "decisions": ["decision 1", "decision 2"],
  "actionItems": [{"item": "task description", "owner": "speaker name or TBD"}],
  "efficiencyScore": 74,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "voiceSummary": "Meeting complete. Efficiency score: [score]. [N] decisions made, [N] action items assigned."
}`,
    }],
  });

  const content = message.content[0]?.text?.trim();
  return JSON.parse(content);
}
