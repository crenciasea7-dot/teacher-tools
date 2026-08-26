/**
 * Diagnostics endpoint used only to identify VWorld WFS layers available to
 * this project's server-side key.  It never returns the API key itself.
 */
module.exports = async (_req, res) => {
  const key = process.env.VWORLD_API_KEY;
  if (!key) return res.status(503).json({ error: 'VWORLD_API_KEY is not configured.' });

  const params = new URLSearchParams({
    service: 'WFS',
    request: 'GetCapabilities',
    version: '1.1.0',
    key,
    domain: 'property-tax-verified.vercel.app'
  });

  try {
    const upstream = await fetch(`https://api.vworld.kr/req/wfs?${params}`);
    const xml = await upstream.text();
    if (!upstream.ok) return res.status(502).json({ error: 'VWorld WFS request failed.', status: upstream.status });

    const matches = [...xml.matchAll(/<(?:\w+:)?Name>([^<]+)<\/(?:\w+:)?Name>/g)].map((m) => m[1]);
    const housingLayers = matches.filter((name) => /apt|house|housing|주택|공동/i.test(name));
    return res.status(200).json({ layers: housingLayers.length ? housingLayers : matches });
  } catch {
    return res.status(502).json({ error: 'Could not reach VWorld WFS.' });
  }
};
