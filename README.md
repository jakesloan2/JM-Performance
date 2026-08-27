# JM Performance — landing page

Single-page site for a vehicle tuning and ECU remapping workshop at
14 Blackstaff Road, Kircubbin, Newtownards BT22 1AQ. Workshop-based only —
there is no mobile service anywhere in the copy or the structured data.
Static HTML/CSS/JS, no build step. Drop it on any host.

```
index.html
robots.txt
sitemap.xml
dvla-proxy-worker.js        ← optional, deploy separately
assets/
  css/styles.css
  img/jm-logo.png           ← extracted from your artwork, transparent background
  img/jm-logo-sm.png        ← favicon
  js/vehicle-data.js        ← 22 makes / 112 models / 438 engines
  js/app.js                 ← CONFIG block is at the top
```

---

## 1. Before it goes live — change these

### `assets/js/app.js` (top of file)

```js
phoneDisplay : '028 9100 0000',        // ← real number
phoneDial    : '+442891000000',        // ← same number, international format
email        : 'info@jmperformance.co.uk',
lookupEndpoint : null,                 // ← see section 3
formEndpoint   : null                  // ← see section 4
```

This one block feeds every phone link, email link and the sticky call bar.

### `index.html` — find and replace

| Find | Replace with |
|---|---|
| `https://jmperformance.co.uk` | your real domain (appears in canonical, OG tags and schema) |
| `+44 28 9100 0000` | real phone number (in the JSON-LD block near the bottom) |
| `"latitude": 54.4922, "longitude": -5.5372` | **verify these** — right-click the workshop pin in Google Maps and copy the exact coordinates. Mine are approximate for Blackstaff Road. |
| `"sameAs": []` | `["https://facebook.com/...", "https://instagram.com/..."]` |

Also update `robots.txt` and `sitemap.xml` with the real domain.

---

## 2. Reviews and ratings — read this bit

The six reviews and the `aggregateRating` in the structured data are
**placeholders**. Replace them with real ones before launch.

Publishing invented reviews with `aggregateRating` markup is a manual-action
risk with Google and, in the UK, falls foul of the Digital Markets,
Competition and Consumers Act 2024 — fake reviews carry real penalties now.
Once you have genuine Google reviews, paste the real text in and set
`ratingCount` to the actual number.

The "2,400+ vehicles tuned", "35% max power gain" and "15% fuel savings"
figures in the stats band are the same deal — set them to numbers you can
stand over.

---

## 3. Turning on real registration lookup

Right now the reg box does three things: validates the plate (current, prefix,
suffix and NI dateless formats all pass), shows the reg on a yellow plate, then
hands off to the make/model/engine picker. That is fully functional as-is and
costs nothing to run.

To make it resolve the vehicle automatically you need two data sources:

**DVLA Vehicle Enquiry Service** — free, apply at
`developer-portal.driver-vehicle-licensing.api.gov.uk`. Returns make, fuel
type, engine capacity, colour, year, tax and MOT status. It does **not**
return the model or any power figures, so on its own it can't drive the
calculator.

**A paid vehicle data provider** — UK Vehicle Data, CarWeb, VDG and similar.
This is where model, variant, bhp and Nm come from. Expect per-lookup pricing.

`dvla-proxy-worker.js` is a Cloudflare Worker that calls both, keeps your API
keys server-side and returns one clean JSON object. Deploy it:

```bash
npm install -g wrangler
wrangler login
wrangler deploy dvla-proxy-worker.js --name jm-reg-lookup
wrangler secret put DVLA_API_KEY
wrangler secret put UKVD_API_KEY      # optional
```

Then set `lookupEndpoint` in `app.js` to the worker URL. Never put an API key
in front-end JavaScript — anyone can read it in two clicks.

If the lookup returns a make but no power figures, the site falls back to the
picker with the make pre-selected. Nothing breaks.

---

## 4. Contact form

Leave `formEndpoint: null` and the form opens the visitor's email app with
everything filled in. Works everywhere, zero setup, but a chunk of people on
phones will bounce off it.

Better: sign up for Formspree, Basin or Netlify Forms and paste the endpoint
in. The form posts JSON and expects a 2xx back.

---

## 5. Tuning figures

Every number in the checker comes from `JM_GAIN_MODEL` at the top of
`vehicle-data.js`:

```js
td:  { s1:{bhp:0.28, nm:0.27}, s2:{bhp:0.38, nm:0.36}, mpg:'8–15%' },
```

Percentages per engine type, applied to the stock figures in the database.
Change these to match what you actually see on your rollers and the whole site
updates. Adding a vehicle is one line:

```js
"Golf Mk7 (2012–2020)": [ ["2.0 TDI GTD 184", 184, 380, "td"], ... ]
//                          label            bhp  Nm   type
```

Types: `td` turbo diesel, `tp` turbo petrol, `na` naturally aspirated petrol,
`nad` naturally aspirated diesel.

---

## 6. What's already done for SEO and AEO

**On-page**
- One `<h1>`, clean `<h2>` hierarchy, semantic sectioning
- Title and meta description written for "ECU remapping County Down" intent
- Canonical, Open Graph, Twitter cards, geo meta
- 50+ town names in the Areas section — these are what local searches actually hit

**Structured data** (one `@graph` block, near the bottom of `index.html`)
- `AutoRepair` / `LocalBusiness` with full `areaServed` list, opening hours,
  geo coordinates and an eight-item `hasOfferCatalog`
- `FAQPage` with all twelve questions — eligible for FAQ rich results
- `WebSite`, `WebPage` and a `speakable` spec for voice assistants

**Answer-engine specifics**
- The "In short" block after the stats is a self-contained ~70-word summary.
  That paragraph is what ChatGPT, Perplexity and AI Overviews tend to lift.
- Every FAQ answer is written to stand alone out of context — no "as mentioned
  above", no dangling pronouns
- `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot,
  OAI-SearchBot, Google-Extended and Applebot-Extended

**Still worth doing after launch**
1. Claim and fill out the Google Business Profile — for a local trade this
   moves the needle harder than anything on the page
2. Get listed on the Google Maps pin with real photos of the unit and the kit
3. Build individual town pages (`/newtownards-remapping/`, `/bangor-remapping/`)
   once the main page is indexed — the current page targets the county, town
   pages target the town. Write them as "drivers from X come to us", not
   "we cover X", so they stay honest about being workshop-based
4. Add real before/after dyno graphs; they earn links and dwell time

---

## 7. Compliance notes worth keeping

The Services section deliberately frames DPF, EGR and AdBlue work as
**diagnostics and repair**, not deletion. Removing or disabling emissions
equipment on a road-registered vehicle is an MOT failure and an offence under
the Road Vehicles (Construction & Use) Regulations 1986, and advertising it
publicly has landed tuners in trouble. The FAQ answers on insurance and
warranty are written the same way — honest, which also happens to be what
Google's helpful-content system rewards.

If you want that copy softened or changed, it's in the `#services` section and
the `compliance-note` paragraph directly below the cards.

---

## 8. Deploying

Any static host: Netlify, Cloudflare Pages, Vercel, GitHub Pages, or plain
FTP to shared hosting. Drag the folder in, point the domain at it, done.
Nothing needs a server except the optional reg-lookup worker.
