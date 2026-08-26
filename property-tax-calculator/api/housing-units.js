/**
 * Official 공동주택가격 attribute API proxy.
 * Given an official PNU (parcel id), returns unit rows including dong, ho and
 * the legally announced price. The VWorld API key remains server-side.
 */
const http = require('http');
const getJson = (url) => new Promise((resolve, reject) => {
  http.get(url, (upstream) => {
    let text = '';
    upstream.setEncoding('utf8');
    upstream.on('data', (chunk) => { text += chunk; });
    upstream.on('end', () => {
      try { resolve({ status: upstream.statusCode || 500, body: JSON.parse(text) }); }
      catch { reject(new Error('Invalid JSON from VWorld')); }
    });
  }).on('error', reject);
});

module.exports = async (req, res) => {
  const pnu = String(req.query?.pnu || '').replace(/\D/g, '');
  const dongNm = String(req.query?.dong || '').trim();
  const hoNm = String(req.query?.ho || '').trim();
  const key = process.env.VWORLD_API_KEY;
  if (pnu.length < 8) return res.status(400).json({ error: 'A valid PNU is required.' });
  if (!key) return res.status(503).json({ error: 'VWORLD_API_KEY is not configured.' });

  const params = new URLSearchParams({
    pnu, stdrYear: '2026', format: 'json', numOfRows: '1000', pageNo: '1', key,
    domain: 'property-tax-verified.vercel.app'
  });
  if (dongNm) params.set('dongNm', dongNm);
  if (hoNm) params.set('hoNm', hoNm);

  try {
    const upstream = await getJson(`http://api.vworld.kr/ned/data/getApartHousingPriceAttr?${params}`);
    const body = upstream.body;
    if (upstream.status < 200 || upstream.status >= 300) return res.status(502).json({ error: 'Official housing-price API failed.' });
    const raw = body?.apartHousingPrices?.field || body?.apartHousingPrices?.item || body?.response?.body?.items?.item || [];
    const rows = (Array.isArray(raw) ? raw : [raw]).filter(Boolean).map((item) => ({
      pnu: item.pnu, complex: item.aphusNm || '', dong: item.dongNm || '', ho: item.hoNm || '',
      area: Number(item.prvuseAr || 0), price: Number(item.pblntfPc || 0), year: item.stdrYear || ''
    }));
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ rows });
  } catch (error) {
    return res.status(502).json({ error: 'Could not reach official housing-price API.' });
  }
};
