/**
 * TinyFish client — web AI platform (Fetch + Search)
 * Docs: https://docs.tinyfish.ai/
 *
 * Fetch API: https://api.fetch.tinyfish.ai  (POST, body: { urls: [] })
 * Search API: https://api.search.tinyfish.ai (GET, query params: ?query=)
 */
import fetch from 'node-fetch';

const KEY = process.env.TINYFISH_API_KEY;

function headers() {
  return {
    'X-API-Key': KEY,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch a URL and return cleaned, structured content.
 * Uses TinyFish Fetch API — renders page and returns markdown.
 *
 * @param {string} url
 * @returns {{ title: string, snippet: string, url: string }}
 */
export async function fetchUrl(url) {
  const res = await fetch('https://api.fetch.tinyfish.ai', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ urls: [url], format: 'markdown' }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TinyFish Fetch failed for ${url}: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const result = data.results?.[0];
  if (!result) throw new Error(`TinyFish Fetch: no result for ${url}`);

  return {
    url: result.final_url || url,
    title: result.title || url,
    snippet: (result.text || '').slice(0, 400),
  };
}

/**
 * Search the web for a topic mentioned in the meeting.
 * Uses TinyFish Search API — returns ranked results.
 *
 * @param {string} query
 * @param {number} limit
 * @returns {Array<{ title: string, url: string, snippet: string }>}
 */
export async function searchTopic(query, limit = 3) {
  const params = new URLSearchParams({ query, language: 'en' });
  const res = await fetch(`https://api.search.tinyfish.ai?${params}`, {
    method: 'GET',
    headers: { 'X-API-Key': KEY },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TinyFish Search failed for "${query}": ${res.status} — ${err}`);
  }

  const data = await res.json();
  return (data.results || []).slice(0, limit).map(r => ({
    title: r.title || '',
    url: r.url || '',
    snippet: r.snippet || '',
  }));
}
