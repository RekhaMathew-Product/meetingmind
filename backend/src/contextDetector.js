/**
 * Context detector — scans the live transcript for URLs and notable topics,
 * then uses TinyFish Fetch/Search to pull live context mid-meeting.
 *
 * Detected triggers:
 *   - URLs mentioned in speech (https://... or "dot com" patterns)
 *   - Company/client/project names (heuristic: capitalized noun phrases)
 *
 * Results are broadcast to the dashboard as `context_card` SSE events.
 */
import { fetchUrl, searchTopic } from './tinyfish.js';
import { broadcastEvent } from './webhook.js';

// Prevent re-fetching the same thing repeatedly
const fetchedCache = new Set();
const CACHE_TTL_MS = 10 * 60 * 1000; // clear every 10 minutes per session

// Regex to find explicit URLs in transcript text
const URL_REGEX = /https?:\/\/[^\s,)]+/gi;

// Heuristic: detect multi-word capitalized proper nouns (likely company/client names)
// e.g. "Acme Corp", "Project Phoenix", "Google Cloud"
const PROPER_NOUN_REGEX = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;

// Common words to ignore so we don't search noise
const IGNORE_LIST = new Set([
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
  'Meeting Mind', 'Google Meet', 'Action Items', 'Next Steps',
]);

/**
 * Process a new transcript entry. Call this from the webhook handler
 * each time a new chunk arrives.
 *
 * @param {string} speaker
 * @param {string} text
 */
export async function processTranscriptForContext(speaker, text) {
  const urlMatches = text.match(URL_REGEX) || [];
  const nounMatches = [...text.matchAll(PROPER_NOUN_REGEX)].map(m => m[1]);

  const toProcess = [];

  for (const url of urlMatches) {
    const key = `url:${url}`;
    if (!fetchedCache.has(key)) {
      fetchedCache.add(key);
      toProcess.push({ type: 'url', value: url });
    }
  }

  for (const noun of nounMatches) {
    if (IGNORE_LIST.has(noun)) continue;
    const key = `noun:${noun.toLowerCase()}`;
    if (!fetchedCache.has(key)) {
      fetchedCache.add(key);
      toProcess.push({ type: 'topic', value: noun });
    }
  }

  // Fire all fetches concurrently (don't await in the webhook hot path)
  for (const item of toProcess) {
    runContextFetch(item, speaker).catch(err =>
      console.warn(`[Context] Fetch failed for "${item.value}":`, err.message)
    );
  }
}

async function runContextFetch({ type, value }, mentionedBy) {
  console.log(`[Context] ${type === 'url' ? 'Fetching URL' : 'Searching topic'}: ${value}`);

  try {
    if (type === 'url') {
      const result = await fetchUrl(value);
      broadcastEvent('context_card', {
        trigger: 'url',
        query: value,
        mentionedBy,
        title: result.title,
        snippet: result.snippet,
        url: result.url,
        ts: Date.now(),
      });
    } else {
      const results = await searchTopic(value, 2);
      if (results.length === 0) return;
      broadcastEvent('context_card', {
        trigger: 'topic',
        query: value,
        mentionedBy,
        results,
        ts: Date.now(),
      });
    }
  } catch (err) {
    console.warn(`[Context] Failed for "${value}":`, err.message);
  }
}

export function clearContextCache() {
  fetchedCache.clear();
}
