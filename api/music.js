export default async function handler(req, res) {
  const allowedOrigins = new Set([
    'https://rupak9373.github.io',
    'https://rupak9373.vercel.app'
  ]);
  const origin = req.headers.origin || '';
  if (allowedOrigins.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Search text is required' });

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: q,
    gsrnamespace: '6',
    gsrlimit: '35',
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    iiurlwidth: '500',
    format: 'json',
    origin: '*'
  });

  try {
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {
      headers: { 'User-Agent': 'RupakPlay/1.1 (legal audio search)' }
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: 'Music search failed' });

    const strip = (html = '') => String(html)
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, ' ')
      .trim();

    const pages = Object.values(data?.query?.pages || {});
    const items = pages.map(p => {
      const ii = p.imageinfo?.[0] || {};
      const meta = ii.extmetadata || {};
      const mime = String(ii.mime || '');
      return {
        id: String(p.pageid || p.title || ''),
        title: String(p.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, ''),
        artist: strip(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Commons'),
        license: strip(meta.LicenseShortName?.value || meta.UsageTerms?.value || 'Open license'),
        audioUrl: ii.url || '',
        downloadUrl: ii.url || '',
        sourceUrl: ii.descriptionurl || '',
        thumbnail: ii.thumburl || '',
        mime
      };
    }).filter(x => x.audioUrl && (x.mime.startsWith('audio/') || /\.(mp3|ogg|oga|wav|flac|opus|m4a|webm)(\?|$)/i.test(x.audioUrl)));

    return res.status(200).json({ items: items.slice(0, 24) });
  } catch (e) {
    return res.status(500).json({ error: 'Music service unavailable' });
  }
}
