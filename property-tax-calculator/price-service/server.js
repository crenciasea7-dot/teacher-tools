const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
// This public lookup service is dedicated to the separate official-price finder.
// Keep the registered VWorld site and CORS origin aligned even when Render's
// Blueprint environment synchronisation retains an older value.
const ALLOWED_ORIGIN = 'https://official-price-finder.vercel.app';
const VWORLD_DOMAIN = 'official-price-finder.vercel.app';
const VWORLD_API_KEY = process.env.VWORLD_API_KEY;

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    // The key remains server-side; this read-only lookup endpoint may be called
    // by the public calculator from desktop or mobile browsers.
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Vary': 'Origin',
    'Cache-Control': 'public, max-age=300'
  });
  res.end(JSON.stringify(data));
}

function vworld(path, params) {
  return new Promise((resolve, reject) => {
    // The VWorld key is registered to the public finder domain. Send that
    // domain for every endpoint (including address search), so its gateway
    // can validate the same registered application throughout the lookup.
    const query = { ...params, key: VWORLD_API_KEY, domain: VWORLD_DOMAIN };
    const url = `https://api.vworld.kr${path}?${new URLSearchParams(query)}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: ALLOWED_ORIGIN, Origin: ALLOWED_ORIGIN } }, (upstream) => {
      let text = '';
      upstream.setEncoding('utf8');
      upstream.on('data', (chunk) => { text += chunk; });
      upstream.on('end', () => {
        try { resolve({ status: upstream.statusCode || 500, body: JSON.parse(text) }); }
        catch {
          // Diagnostics deliberately exclude the response body and request URL,
          // both of which could contain sensitive service information.
          console.warn(`VWorld non-JSON response: HTTP ${upstream.statusCode || 500}`, text.slice(0, 500));
          reject(new Error(`VWorld returned HTTP ${upstream.statusCode || 500} (${upstream.headers['content-type'] || 'unknown content type'}).`));
        }
      });
    }).on('error', reject);
  });
}

function parseRows(body) {
  const raw = body?.apartHousingPrices?.field || body?.apartHousingPrices?.item || body?.response?.body?.items?.item || [];
  return (Array.isArray(raw) ? raw : [raw]).filter(Boolean).map((item) => ({
    pnu: String(item.pnu || ''), complex: item.aphusNm || '', dong: item.dongNm || '', ho: item.hoNm || '',
    area: Number(item.prvuseAr || 0), price: Number(item.pblntfPc || 0), year: item.stdrYear || ''
  }));
}

async function handler(req, res) {
  if (!VWORLD_API_KEY) return send(res, 503, { error: 'Price service is not configured.' });
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    if (path === '/health') return send(res, 200, { ok: true });
    if (path === '/address-search') {
      const q = (url.searchParams.get('q') || '').trim();
      if (q.length < 2) return send(res, 400, { error: 'Enter at least two characters.' });
      const result = await vworld('/req/search', { service: 'search', request: 'search', version: '2.0', type: 'address', category: 'road', crs: 'EPSG:4326', format: 'json', errorformat: 'json', size: '10', page: '1', query: q });
      const items = result.body?.response?.result?.items || [];
      return send(res, 200, { items: items.map((item) => ({
        title: item.title || item.address?.road || item.address?.parcel || '',
        address: item.address?.road || item.address?.parcel || item.title || '', point: item.point || null
      })) });
    }
    if (path === '/complexes') {
      const lat = Number(url.searchParams.get('lat')), lng = Number(url.searchParams.get('lng'));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return send(res, 400, { error: 'Coordinates are required.' });
      const d = 0.0015;
      // EPSG:4326 WFS bounding boxes are x/y (longitude/latitude), not lat/lng.
      const bbox = [lng - d, lat - d, lng + d, lat + d, 'EPSG:4326'].join(',');
      const result = await vworld('/ned/wfs/getApartHousingPriceWFS', { typename: 'dt_d166', bbox, maxFeatures: '100', output: 'application/json', srsName: 'EPSG:4326' });
      const features = result.body?.features || [];
      return send(res, 200, { complexes: features.map((feature) => {
        const p = feature.properties || {};
        return { pnu: String(p.pnu || ''), name: p.aphus_nm || '', averagePrice: Number(p.avrg_pblntf_pc || 0), units: Number(p.calc_aphus_ho_co || 0) };
      }).filter((item) => item.pnu) });
    }
    if (path === '/units') {
      const pnu = (url.searchParams.get('pnu') || '').replace(/\D/g, '');
      const dong = (url.searchParams.get('dong') || '').trim();
      const ho = (url.searchParams.get('ho') || '').trim();
      if (pnu.length < 8) return send(res, 400, { error: 'A valid parcel identifier is required.' });
      const result = await vworld('/ned/data/getApartHousingPriceAttr', { pnu, stdrYear: '2026', dongNm: dong, hoNm: ho, format: 'json', numOfRows: '1000', pageNo: '1' });
      return send(res, 200, { rows: parseRows(result.body) });
    }
    return send(res, 404, { error: 'Not found.' });
  } catch (error) {
    // Only expose transport information; never include the API key or request URL.
    return send(res, 502, { error: 'Official price provider connection failed.', detail: String(error.message || error).slice(0, 180) });
  }
}

http.createServer(handler).listen(PORT, () => console.log(`Price service listening on ${PORT}`));
