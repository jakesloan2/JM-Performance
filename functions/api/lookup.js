/* ═══════════════════════════════════════════════════════════════
   JM PERFORMANCE — /api/lookup   (Cloudflare Pages Function)
   ---------------------------------------------------------------
   Lives in /functions/api/lookup.js, so Cloudflare Pages deploys
   it automatically alongside the site every time you push to
   GitHub. No separate worker, no separate deploy.

   It calls the DVLA Vehicle Enquiry Service (free) and hands back
   make, fuel, engine size and year. The site uses those four
   things to narrow its own database down to the right engine.

   SETUP — once
     1. Free DVLA key:
        register at  https://register-for-ves.driver-vehicle-licensing.api.gov.uk
        (approval usually takes a few working days)
     2. Cloudflare dashboard → your Pages project → Settings →
        Environment variables → add   DVLA_API_KEY   as a SECRET
     3. Redeploy (or just push a commit). Done.

   COST: £0. DVLA VES is free. Pages Functions are free to
   100,000 requests a day.
   ═══════════════════════════════════════════════════════════════ */

const DVLA_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

export async function onRequestPost({ request, env }) {
  const json = (body, status = 200, extra = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra }
    });

  if (!env.DVLA_API_KEY) {
    return json({ error: 'Lookup not configured' }, 503);
  }

  let reg = '';
  try { ({ registrationNumber: reg } = await request.json()); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  reg = String(reg || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (reg.length < 2 || reg.length > 8) return json({ error: 'Invalid registration' }, 400);

  /* ── simple per-IP rate limit via the cache, so a bot can't burn the quota ── */
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const cache = caches.default;
  const rlKey = new Request(`https://ratelimit.local/${ip}`);
  const hit = await cache.match(rlKey);
  const count = hit ? Number(await hit.text()) : 0;
  if (count > 30) return json({ error: 'Too many lookups — try again in a minute' }, 429);
  await cache.put(rlKey, new Response(String(count + 1), { headers: { 'Cache-Control': 'max-age=60' } }));

  /* ── DVLA ── */
  let r;
  try {
    r = await fetch(DVLA_URL, {
      method: 'POST',
      headers: { 'x-api-key': env.DVLA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationNumber: reg })
    });
  } catch { return json({ error: 'DVLA unavailable' }, 502); }

  if (r.status === 404) return json({ error: 'No vehicle found' }, 404);
  if (!r.ok)            return json({ error: 'DVLA returned ' + r.status }, 502);

  const d = await r.json();

  return json({
    registrationNumber : reg,
    make               : d.make || null,
    fuelType           : d.fuelType || null,
    engineCapacity     : d.engineCapacity || null,   // cc
    yearOfManufacture  : d.yearOfManufacture || null,
    colour             : d.colour || null,
    motStatus          : d.motStatus || null,
    taxStatus          : d.taxStatus || null
  });
}

/* Anything other than POST */
export async function onRequest({ request }) {
  if (request.method === 'POST') return onRequestPost(arguments[0]);
  return new Response(JSON.stringify({ error: 'Use POST' }), {
    status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' }
  });
}
