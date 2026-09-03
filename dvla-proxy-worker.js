/* ═══════════════════════════════════════════════════════════════
   JM PERFORMANCE — registration lookup proxy (standalone Worker)
   ---------------------------------------------------------------
   ONLY NEEDED if you host somewhere other than Cloudflare Pages.
   On Cloudflare Pages, /functions/api/lookup.js does this job
   automatically — ignore this file.
   ---------------------------------------------------------------
   Your API keys must never sit in front-end JavaScript. This little
   worker keeps them server-side and gives the site a single, safe
   endpoint to call.

   DEPLOY
     1. npm install -g wrangler && wrangler login
     2. wrangler deploy dvla-proxy-worker.js --name jm-reg-lookup
     3. wrangler secret put DVLA_API_KEY
        (optional) wrangler secret put UKVD_API_KEY
     4. Put the worker URL into CONFIG.lookupEndpoint in assets/js/app.js

   WHAT EACH API GIVES YOU
     DVLA Vehicle Enquiry Service (free, apply at dvla.gov.uk)
       → make, colour, fuel type, engine capacity, year, tax/MOT status
       → does NOT return model or power figures
     A paid data provider (UK Vehicle Data, CarWeb, VDG…)
       → model, variant, trim, bhp, Nm — the bits you actually need
   ═══════════════════════════════════════════════════════════════ */

const ALLOWED_ORIGINS = [
  'https://jm-performance.co.uk',
  'https://www.jm-performance.co.uk'
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405, cors);

    let reg;
    try {
      ({ registrationNumber: reg } = await request.json());
    } catch { return json({ error: 'Invalid JSON body' }, 400, cors); }

    reg = String(reg || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!reg || reg.length < 2 || reg.length > 8) {
      return json({ error: 'Invalid registration' }, 400, cors);
    }

    /* ── 1. DVLA VES: make, fuel, engine size, year ── */
    let dvla = {};
    if (env.DVLA_API_KEY) {
      const r = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
        method: 'POST',
        headers: { 'x-api-key': env.DVLA_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationNumber: reg })
      });
      if (r.status === 404) return json({ error: 'No vehicle found for that registration' }, 404, cors);
      if (!r.ok) return json({ error: 'Lookup service unavailable' }, 502, cors);
      dvla = await r.json();
    }

    /* ── 2. Paid provider: model, variant, power ──
       Swap the URL and field names for whichever provider you sign
       up with. The shape returned to the site is what matters.      */
    let extra = {};
    if (env.UKVD_API_KEY) {
      try {
        const r = await fetch(
          `https://uk1.ukvehicledata.co.uk/api/datapackage/VehicleData?v=2&api_nullitems=1&auth_apikey=${env.UKVD_API_KEY}&key_VRM=${reg}`
        );
        if (r.ok) {
          const d = await r.json();
          const s = d?.Response?.DataItems?.SmmtDetails || {};
          const t = d?.Response?.DataItems?.TechnicalDetails?.Performance || {};
          extra = {
            model  : s.Range || null,
            engine : s.ModelVariant || s.EngineCapacity || null,
            enginePowerBhp : t.Power?.Bhp ?? null,
            enginePowerNm  : t.Torque?.Nm ?? null
          };
        }
      } catch { /* fall through — the site handles a partial result */ }
    }

    return json({
      registrationNumber : reg,
      make               : dvla.make || null,
      model              : extra.model || null,
      engine             : extra.engine || (dvla.engineCapacity ? dvla.engineCapacity + 'cc' : null),
      fuelType           : dvla.fuelType || null,
      yearOfManufacture  : dvla.yearOfManufacture || null,
      colour             : dvla.colour || null,
      enginePowerBhp     : extra.enginePowerBhp,
      enginePowerNm      : extra.enginePowerNm
    }, 200, { ...cors, 'Cache-Control': 'public, max-age=86400' });
  }
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}
