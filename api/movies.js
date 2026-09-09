export default async function handler(req, res) {
  const allowedOrigins = new Set(['https://rupak9373.github.io','https://rupak9373.vercel.app']);
  const origin = req.headers.origin || '';
  if (allowedOrigins.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Search text is required' });

  try {
    const params = new URLSearchParams({term:q,country:'IN',media:'movie',entity:'movie',limit:'40'});
    const r = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: 'Movie catalog search failed' });
    const items = (data.results || []).map(x => ({
      id: String(x.trackId || x.collectionId || ''),
      title: x.trackName || x.collectionName || 'Untitled',
      creator: x.artistName || '',
      genre: x.primaryGenreName || '',
      year: x.releaseDate ? String(x.releaseDate).slice(0,4) : '',
      description: x.longDescription || x.shortDescription || '',
      poster: String(x.artworkUrl100 || '').replace('100x100bb','600x600bb'),
      previewUrl: x.previewUrl || '',
      officialUrl: x.trackViewUrl || ''
    })).filter(x => x.id && x.title);
    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'Movie catalog unavailable' });
  }
}
