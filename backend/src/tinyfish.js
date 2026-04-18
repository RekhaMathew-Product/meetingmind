/**
 * TinyFish client — web AI platform (Fetch + Search)
 * Docs: https://www.tinyfish.ai/
 *
 * Used in MeetingMind to pull live context mid-meeting:
 *   - If someone mentions a client URL → Fetch it for clean summary
 *   - If a topic/company is mentioned → Search for quick context
 */
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
 * Fetch a URL and return cleaned, structured content.
 * Uses TinyFish Fetch — pulls any URL to clean readable content.
 *
 * @param {string} url - The URL to fetch
 * @returns {{ title: string, content: string, url: string }}
 */
export async function fetchUrl(url) {
  const res = await fetch(`${BASE}/fetch`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TinyFish Fetch failed for ${url}: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return {
    url,
    title: data.title || url,
    content: data.content || data.text || '',
    snippet: (data.content || data.text || '').slice(0, 400),
  };
}

/**
 * Search the web for a topic mentioned in the meeting.
 * Uses TinyFish Search — fast, structured web search.
 *
 * @param {string} query - Search query (e.g. company name, project)
 * @param {number} limit - Max results to return
 * @returns {Array<{ title: string, url: string, snippet: string }>}
 */
export async function searchTopic(query, limit = 3) {
  const res = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query, limit }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TinyFish Search failed for "${query}": ${res.status} — ${err}`);
  }

  const data = await res.json();
  // Normalize result shape — check TinyFish docs for actual response field names
  const results = data.results || data.items || [];
  return results.slice(0, limit).map(r => ({
    title: r.title || r.name || '',
    url: r.url || r.link || '',
    snippet: r.snippet || r.description || r.content?.slice(0, 300) || '',
  }));
}
