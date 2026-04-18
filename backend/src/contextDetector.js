/**
 * Context detector — triggers TinyFish Search when a speaker expresses
 * uncertainty ("I don't know", "I'm not sure", etc.).
 *
 * Flow:
 *   1. Detect uncertainty phrase in transcript chunk
 *   2. Grab last ~100 words of transcript as context
 *   3. Ask Claude: "what topic should I search for?"
 *   4. TinyFish Search that topic
 *   5. Broadcast context_card to dashboard
 */
import Anthropic from '@anthropic-ai/sdk';
import { searchTopic } from './tinyfish.js';
import { broadcastEvent } from './webhook.js';
import { lastNWords } from './state.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cooldown: don't trigger again for 60s after a search fires
let lastTriggeredAt = 0;
const TRIGGER_COOLDOWN_MS = 60_000;

// Phrases that indicate the speaker doesn't know something
const UNCERTAINTY_PATTERNS = [
  /i('m| am) not sure/i,
  /i don'?t know/i,
  /i('m| am) unsure/i,
  /i('m| am) not certain/i,
  /i don'?t remember/i,
  /i('m| am) not (100|fully|totally|completely) sure/i,
  /no idea/i,
  /i forget/i,
  /i can'?t remember/i,
  /not (quite |totally |fully )?sure (about|what|how|why|when|where|who)/i,
];

function detectsUncertainty(text) {
  return UNCERTAINTY_PATTERNS.some(p => p.test(text));
}

/**
 * Called from webhook.js on every transcript chunk.
 */
export async function processTranscriptForContext(speaker, text) {
  if (!detectsUncertainty(text)) return;

  const now = Date.now();
  if (now - lastTriggeredAt < TRIGGER_COOLDOWN_MS) return;
  lastTriggeredAt = now;

  console.log(`[Context] Uncertainty detected from ${speaker}: "${text}"`);

  // Don't await — fire and forget so webhook responds immediately
  runContextSearch(speaker).catch(err =>
    console.warn('[Context] Search failed:', err.message)
  );
}

async function runContextSearch(mentionedBy) {
  // Get recent transcript for context
  const recentContext = lastNWords(100);

  // Ask Claude what to search for
  let searchQuery;
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `A meeting participant just said they don't know or aren't sure about something.

Recent conversation:
${recentContext}

What is the ONE specific topic, term, or question they are uncertain about?
Reply with ONLY a short search query (5 words max). No explanation.`,
      }],
    });
    searchQuery = message.content[0]?.text?.trim();
  } catch (err) {
    console.warn('[Context] Claude query extraction failed:', err.message);
    return;
  }

  if (!searchQuery) return;
  console.log(`[Context] Searching TinyFish for: "${searchQuery}"`);

  try {
    const results = await searchTopic(searchQuery, 3);
    if (results.length === 0) return;

    broadcastEvent('context_card', {
      trigger: 'uncertainty',
      query: searchQuery,
      mentionedBy,
      results,
      ts: Date.now(),
    });

    console.log(`[Context] Broadcast ${results.length} results for "${searchQuery}"`);
  } catch (err) {
    console.warn(`[Context] TinyFish search failed for "${searchQuery}":`, err.message);
  }
}

export function clearContextCache() {
  lastTriggeredAt = 0;
}
