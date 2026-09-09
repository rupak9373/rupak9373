export default async function handler(req, res) {
  const allowedOrigin = 'https://rupak9373.github.io';
  const origin = req.headers.origin || '';
  if (origin === allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server API key is not configured' });

  const q = String(req.query.q || '').trim();
  const mode = String(req.query.mode || 'video');
  if (!q) return res.status(400).json({ error: 'Search text is required' });

  const searchText = mode === 'music' ? `${q} song music` : q;
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '12',
    q: searchText,
    key,
    safeSearch: 'moderate',
    videoEmbeddable: 'true'
  });

  try {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'Search failed' });

    const items = (data.items || []).map(v => ({
      id: v.id?.videoId,
      title: v.snippet?.title || 'Untitled',
      channel: v.snippet?.channelTitle || '',
      thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
      publishedAt: v.snippet?.publishedAt || ''
    })).filter(v => v.id);

    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'Search service unavailable' });
  }
}
