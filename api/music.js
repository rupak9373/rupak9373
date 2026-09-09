export default async function handler(req, res) {
  const allowedOrigin = 'https://rupak9373.github.io';
  const origin = req.headers.origin || '';
  if (origin === allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Search text is required' });

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${q} filetype:audio`,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    format: 'json',
    origin: '*'
  });

  try {
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {
      headers: { 'User-Agent': 'RupakPlay/1.0' }
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: 'Music search failed' });

    const strip = (html = '') => String(html).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    const pages = Object.values(data?.query?.pages || {});
    const items = pages.map(p => {
      const ii = p.imageinfo?.[0] || {};
      const meta = ii.extmetadata || {};
      return {
        id: String(p.pageid || p.title || ''),
        title: String(p.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, ''),
        artist: strip(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Commons'),
        license: strip(meta.LicenseShortName?.value || 'Open license'),
        audioUrl: ii.url || '',
        downloadUrl: ii.url || '',
        sourceUrl: ii.descriptionurl || ''
      };
    }).filter(x => x.audioUrl && /\.(mp3|ogg|oga|wav|flac|opus|m4a)(\?|$)/i.test(x.audioUrl));

    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'Music service unavailable' });
  }
}
