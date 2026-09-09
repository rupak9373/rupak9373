export default async function handler(req, res) {
  const allowedOrigins = new Set([
    'https://rupak9373.github.io',
    'https://rupak9373.vercel.app'
  ]);
  const origin = req.headers.origin || '';
  if (allowedOrigins.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Search text is required' });

  try {
    const params = new URLSearchParams({
      term: q,
      country: 'IN',
      media: 'music',
      entity: 'song',
      limit: '30',
      explicit: 'No'
    });
    const r = await fetch(`https://itunes.apple.com/search?${params.toString()}`, {
      headers: { 'User-Agent': 'RupakPlay/2.0' }
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: 'Music search failed' });

    const items = (data.results || []).filter(x => x.previewUrl).map(x => ({
      id: String(x.trackId || x.collectionId || Math.random()),
      title: String(x.trackName || 'Untitled'),
      artist: String(x.artistName || 'Unknown artist'),
      album: String(x.collectionName || ''),
      releaseDate: String(x.releaseDate || ''),
      license: 'Official catalog preview',
      audioUrl: x.previewUrl,
      downloadUrl: '',
      sourceUrl: x.trackViewUrl || x.collectionViewUrl || '',
      thumbnail: String(x.artworkUrl100 || '').replace('100x100bb','600x600bb')
    }));

    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'Music service unavailable' });
  }
}
