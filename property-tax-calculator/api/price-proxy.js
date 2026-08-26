/** Proxy to the separately hosted official-price service. */
module.exports = async (req, res) => {
  const base = process.env.PRICE_SERVICE_URL;
  const action = String(req.query?.action || '');
  if (!base) return res.status(503).json({ error: 'Official price lookup service is not connected yet.' });
  if (!['address-search', 'complexes', 'units'].includes(action)) return res.status(404).json({ error: 'Unknown price lookup action.' });
  const params = new URLSearchParams(req.query || {});
  params.delete('action');
  try {
    const upstream = await fetch(`${base.replace(/\/$/, '')}/${action}?${params}`);
    const body = await upstream.json();
    return res.status(upstream.status).json(body);
  } catch {
    return res.status(502).json({ error: 'Official price lookup service could not be reached.' });
  }
};
