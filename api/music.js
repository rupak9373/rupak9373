export default async function handler(req, res) {
  const allowedOrigins = new Set([
    'https://rupak9373.github.io',
    'https://rupak9373.vercel.app'
  ]);
  const origin = req.headers.origin || '';
  if (allowedOrigins.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Search text is required' });

  const esc = q.replace(/["\\]/g, ' ').trim();
  const params = new URLSearchParams({
    q: `mediatype:audio AND (${esc})`,
    fl: 'identifier,title,creator,licenseurl,description',
    rows: '18',
    page: '1',
    output: 'json',
    sort: 'downloads desc'
  });

  try {
    const sr = await fetch(`https://archive.org/advancedsearch.php?${params.toString()}`, {
      headers: { 'User-Agent': 'RupakPlay/1.2' }
    });
    const sdata = await sr.json();
    if (!sr.ok) return res.status(sr.status).json({ error: 'Music search failed' });

    const docs = sdata?.response?.docs || [];
    const picked = [];

    for (const doc of docs) {
      if (picked.length >= 12) break;
      try {
        const mr = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`);
        if (!mr.ok) continue;
        const meta = await mr.json();
        const files = Array.isArray(meta.files) ? meta.files : [];

        const audioFile = files.find(f => {
          const name = String(f.name || '');
          const format = String(f.format || '').toLowerCase();
          return !name.includes('_files.xml') && !name.includes('_meta.xml') && (
            /\.(mp3|ogg|oga|wav|flac|opus|m4a)$/i.test(name) ||
            format.includes('mp3') || format.includes('ogg') || format.includes('flac') || format.includes('wav')
          );
        });
        if (!audioFile?.name) continue;

        const id = doc.identifier;
        const fileUrl = `https://archive.org/download/${encodeURIComponent(id)}/${audioFile.name.split('/').map(encodeURIComponent).join('/')}`;
        const thumb = `https://archive.org/services/img/${encodeURIComponent(id)}`;
        const md = meta.metadata || {};
        const license = md.licenseurl || doc.licenseurl || md.rights || 'Internet Archive';

        picked.push({
          id,
          title: String(md.title || doc.title || id),
          artist: String(md.creator || doc.creator || 'Unknown artist'),
          license: Array.isArray(license) ? String(license[0] || 'Internet Archive') : String(license),
          audioUrl: fileUrl,
          downloadUrl: fileUrl,
          sourceUrl: `https://archive.org/details/${encodeURIComponent(id)}`,
          thumbnail: thumb
        });
      } catch (_) {}
    }

    return res.status(200).json({ items: picked });
  } catch (e) {
    return res.status(500).json({ error: 'Music service unavailable' });
  }
}
