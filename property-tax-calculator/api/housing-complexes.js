/**
 * Official 공동주택가격 WFS proxy. Finds complex features near a geocoded
 * address; the selected PNU can then be used to load official unit prices.
 */
module.exports = async (req, res) => {
  const lat = Number(req.query?.lat), lng = Number(req.query?.lng);
  const key = process.env.VWORLD_API_KEY;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'Coordinates are required.' });
  if (!key) return res.status(503).json({ error: 'VWORLD_API_KEY is not configured.' });
  const delta = 0.0015;
  const bbox = [lat - delta, lng - delta, lat + delta, lng + delta, 'EPSG:4326'].join(',');
  const params = new URLSearchParams({
    typename: 'dt_d166', bbox, maxFeatures: '100', output: 'application/json',
    srsName: 'EPSG:4326', key, domain: 'property-tax-verified.vercel.app'
  });
  try {
    const upstream = await fetch(`https://api.vworld.kr/ned/wfs/getApartHousingPriceWFS?${params}`);
    const body = await upstream.json();
    if (!upstream.ok) return res.status(502).json({ error: 'Official housing-price map API failed.' });
    const features = body?.features || [];
    return res.status(200).json({ complexes: features.map((feature) => {
      const p = feature.properties || {};
      return { pnu: p.pnu || '', name: p.aphus_nm || '', averagePrice: Number(p.avrg_pblntf_pc || 0), units: Number(p.calc_aphus_ho_co || 0) };
    }).filter((x) => x.pnu) });
  } catch {
    return res.status(502).json({ error: 'Could not reach official housing-price map API.' });
  }
};
