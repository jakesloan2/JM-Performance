# JM Performance — landing page

Single-page site for a vehicle tuning and ECU remapping business at
14 Blackstaff Road, Kircubbin, Newtownards BT22 1AQ, offering both workshop
and mobile remapping across County Down. Static HTML/CSS/JS, no build step.
Drop it on any host.

```
index.html
robots.txt
sitemap.xml
dvla-proxy-worker.js        ← optional, deploy separately
assets/
  css/styles.css
  img/jm-logo.png           ← extracted from your artwork, transparent background
  img/jm-logo-sm.png        ← favicon
  js/vehicle-data.js        ← 27 makes / 284 models / 968 engines, current to 2026
  js/app.js                 ← CONFIG block is at the top
```

---

## 1. Before it goes live — change these

### `assets/js/app.js` (top of file)

```js
phoneDisplay  : '07801 265432',        // ← set (mobile only, no landline)
phoneDial     : '+447801265432',       // ← set
mobileDisplay : '07801 265432',        // ← set
mobileDial    : '+447801265432',       // ← set
messageChannel: 'whatsapp',            // ← 'whatsapp' or 'sms'
email         : 'Joshmcmaster1234@gmail.com',   // ← set
reviewUrl     : null,                  // ← see section 2
lookupEndpoint : null,                 // ← see section 3
formEndpoint   : null                  // ← see section 4
```

This one block feeds every phone link, email link, the sticky mobile bar and
the "Send details" message.

**`mobileDial` must be in full international format** — `+447712345678`, not
`07712345678`. WhatsApp will not open on a number starting with 0.

### The "Send details" button

The sticky bar on phones and tablets has two halves: **Call now** (dials
`mobileDial`) and **Send details** (opens WhatsApp or SMS with a message
already written). The message looks like this:

```
Hi JM Performance, I'd like a quote.

Your name:
Phone:
Email:
Registration:
Your town:
What I'm after: Stage 1 remap
Anything else:
```

It fills itself in as they go. If they've typed anything into the contact form,
those values appear. If they've run the reg checker and tapped "Book this map",
the registration and the vehicle come through automatically. Whatever's left
blank they complete on their phone before hitting send — so you always get the
same seven pieces of information in the same order, which makes quoting fast.

To switch from WhatsApp to a normal text, set `messageChannel: 'sms'`.
WhatsApp is the default because the link is more reliable across phones and
you get read receipts.

### `index.html` — find and replace

| Find | Replace with |
|---|---|
| `https://jm-performance.co.uk` | your real domain (appears in canonical, OG tags and schema) |
| `+44 28 9100 0000` | real phone number (in the JSON-LD block near the bottom) |
| `"latitude": 54.4922, "longitude": -5.5372` | **verify these** — right-click the workshop pin in Google Maps and copy the exact coordinates. Mine are approximate for Blackstaff Road. |
| `"sameAs": []` | `["https://facebook.com/...", "https://instagram.com/..."]` |

Also update `robots.txt` and `sitemap.xml` with the real domain.

---

## 2. Reviews — how to add them

There are **no reviews and no ratings on the site**, deliberately. The
`aggregateRating` markup is gone from the structured data too.

Under the UK Digital Markets, Competition and Consumers Act 2024, publishing
fake or incentivised reviews is unlawful and carries real penalties. Google also
issues manual actions for `aggregateRating` markup not backed by genuine
reviews. For a new business an honest "we're just starting out" reads better
than five suspiciously glowing testimonials anyway.

**To switch the review button on:** in your Google Business Profile go to
*Read reviews → Get more reviews*, copy the short link, paste it into
`reviewUrl` in `app.js`. The button stays hidden until you do.

**To add real reviews:** open the `#reviews` section in `index.html`. There is a
commented-out `.reviews-grid` with a template `<figure>`. Delete the
`.reviews-empty` block, uncomment the grid, and copy the figure once per
review. Use the customer's actual words and their real first name and town.

**Once you have genuine reviews you can add the rating back.** Put this inside
the business node in the JSON-LD, with numbers matching your real Google
profile exactly:

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.9",
  "bestRating": "5",
  "ratingCount": "23"
},
```

The stats band no longer claims vehicle counts or percentages either. It now
shows four things that are true from day one: VASS specialism, custom files,
stock file archived, 30-day guarantee.

---

## 3. Registration lookup — current status

**DVLA VES registration is closed.** As of September 2026 the DVLA is not
accepting new API key applications while it upgrades the system, with no
reopening date published. Checked at
register-for-ves.driver-vehicle-licensing.api.gov.uk.

So the automatic lookup cannot be switched on right now. The code is written
and waiting — `functions/api/lookup.js` plus `CONFIG.lookupEndpoint` — and
needs nothing but the key when applications reopen.

### What runs instead, free, today

The plate itself carries the year. `SG21` means 2021, and the site reads that
without any API at all, then offers only the generations on sale around then,
with everything older tucked below a divider. On a 2021 Audi plate that cuts
22 models to 11.

So the flow is: type the reg → the year is read → pick make → short list →
pick engine → figures. Two taps rather than three, at zero cost.

### Worth knowing before paying anyone

Even with a VES key, the DVLA returns **make, fuel, engine size and year — not
the model and not any power figure.** It would narrow the list further; it
would never have skipped the picker entirely. Paid providers (UK Vehicle Data,
CarWeb, VDG) do return model and power, at a per-lookup cost.

**Check back every month or two.** When registration reopens: get the key,
host on Cloudflare Pages, add `DVLA_API_KEY` as a secret. Section 10 has the
full steps.

---

## 5. Tuning figures — and how far to trust them

### Units

The power figure stored is the manufacturer's **PS**, because that is what the
badge says: a "40 TDI" is 204 PS. The site shows both — "204 PS · 201 bhp" —
so a customer comparing against their handbook sees a match either way.
1 PS = 0.98632 bhp. **Do not enter bhp in the database.**

### Verified vs unverified

Each engine can carry a fifth value, `1`, marking it as checked against
manufacturer or authoritative data:

```js
["2.0 TDI GTD 184 PS", 184, 380, "td", 1]
//   label             PS   Nm   type  verified
```

Verified engines show a green "checked against manufacturer data" line in the
results. Everything else shows "our best record for this engine — worth
checking against your V5C". That is deliberate: it is honest, and it invites
the customer to correct you rather than arrive with wrong expectations.

**Currently 25 of 974 engines are verified.** Those are the ones checked
directly against manufacturer sources:

| Platform | Source | Result |
|---|---|---|
| Audi A5 F5 | audi-mediacenter.com | **4 errors found and fixed** |
| Audi A4 B9 facelift | audi-mediacenter.com | corrected |
| VW Golf Mk7 | VW newsroom | correct; 220 PS GTI was missing, added |
| VW Transporter T6.1 | manufacturer data | all 4 correct |
| Ford Transit Custom | Ford media spec sheet | all 3 correct |

Three of five platforms were already right, so the database is broadly sound —
but the A5 had four errors in one model, so it is not uniformly right either.

### Verifying more

The honest position: 974 engines cannot be checked from memory, and the ones
that matter are the ones that come through the door. Work through your most
common engines, check each against the manufacturer's own technical data (VW
newsroom, audi-mediacenter, Ford media, press packs), correct the numbers and
add `, 1` to the end of that engine's array. The badge updates itself.

Prioritise by what you actually see: Golf, Octavia, Leon, A3, A4, Transporter,
Transit, Passat, Tiguan. Those are roughly half the work.

### Gain percentages

Every stage figure comes from `JM_GAIN_MODEL` at the top of the file:

```js
td:  { s1:{bhp:0.28, nm:0.27}, s2:{bhp:0.38, nm:0.36}, mpg:'8–15%' },
```

Percentages per engine type, applied to the stock figures. Change these to
match what you actually see on the rollers and every figure on the site
updates at once.

Types: `td` turbo diesel, `tp` turbo petrol, `na` naturally aspirated petrol,
`nad` naturally aspirated diesel.

---

## 6. What's already done for SEO and AEO

**Positioning**
- Title, meta description and hero all lead with "ECU remapping specialist" and
  "VASS specialist"
- A dedicated `#vass` section naming the brands and the actual engine and gearbox
  codes (EA189, EA288, EA211, EA888, DQ250, DQ381, DL382) — that is what people
  search once they know what they are driving
- `knowsAbout` and `slogan` in the schema, a VASS service in the offer catalogue,
  and a specialism FAQ

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
3. Build individual town pages (`/mobile-remapping-newtownards/`,
   `/remapping-bangor/`) once the main page is indexed. "Mobile car remapping
   [town]" is a high-intent, low-competition search and now genuinely true —
   it is probably the single biggest SEO opportunity left
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

## 8. Pre-launch checklist — all 20 done

| # | Item | Status |
|---|---|---|
| 1 | Privacy policy | `privacy.html` — UK GDPR, lawful bases, retention, ICO details |
| 2 | Terms page | `terms.html` — guide figures, warranty/insurance duty, 30-day guarantee, liability |
| 3 | Clear CTA | Reg checker in the hero, sticky call/message bar, CTA in every section |
| 4 | FAQ | 13 questions, all in FAQPage schema |
| 5 | robots.txt | Allows all, names the AI crawlers, points at the sitemap |
| 6 | sitemap.xml | Home, privacy, terms |
| 7 | Custom 404 | `404.html` — noindex, links to the six main sections |
| 8 | Alt text | Every image checked; decorative loader logo correctly `alt=""` |
| 9 | Analytics | `consent.js` — Plausible or GA4, loads only after consent |
| 10 | Meta titles | Unique per page, lead with the specialism |
| 11 | Meta descriptions | Unique per page, under 160 chars |
| 12 | Social share | OG + Twitter cards, 1200×630 image cut from the brand film |
| 13 | Favicon | SVG + PNG + apple-touch-icon + `site.webmanifest` |
| 14 | Canonical URLs | On all four pages |
| 15 | Cookie consent | Banner, nothing set before a choice, reopenable from footer and privacy page |
| 16 | Mobile version | 8 viewports, zero horizontal overflow |
| 17 | Accessibility | **axe-core: zero violations on all four pages** |
| 18 | Test forms | Validation, message building and both send paths tested |
| 19 | Broken links | Every internal link, anchor and asset path verified |
| 20 | Performance | Lazy video, preloaded fonts, cache headers, dimensioned images |

### What accessibility testing actually found

Five real failures, all fixed:

1. **Contrast** — the dimmest grey (`#6E7889`) failed 4.5:1 on the contact labels. Lifted to `#8B94A6`.
2. **Contrast** — the 404 button inherited a link colour over blue, giving 1.65:1. Forced white.
3. **Heading order** — footer `<h4>`s followed an `<h2>`, skipping a level. Now `<h2 class="footer-h">`.
4. **Link in text block** — inline links were distinguished by colour alone. Now underlined.
5. **Landmark** — the sticky bar sat outside any landmark. Now a `<nav aria-label="Quick contact">`.

### Analytics — nothing configured, nothing costing

`assets/js/consent.js` has all three options set to `null`. **No analytics
runs, no cookies are set, and no cookie banner appears** — because with nothing
configured there is genuinely nothing to consent to. Showing a cookie banner on
a site that sets no cookies would be misleading.

To turn numbers on, fill in one. The banner appears by itself when needed.

| Option | Cost | Cookie banner? |
|---|---|---|
| `ga4Id` | **Free** | Yes — GA4 sets cookies, so it waits for consent |
| `cfToken` | **Free** | No — Cloudflare Web Analytics is cookieless, loads straight away |
| `plausible` | ~£7/mo | Yes. Listed for completeness; the two above are free |

Tested in all three states: nothing set → no banner, no scripts. GA4 set →
banner shows, zero scripts before consent, GA4 loads after accept. Cloudflare
set → no banner, beacon loads immediately (correct — it sets no cookies).

**My suggestion:** if you host on Cloudflare Pages, use `cfToken`. Free,
no banner needed, and nobody has to click anything. Otherwise GA4.

### Server config

`_headers` (Cloudflare Pages / Netlify) and `.htaccess` (Apache) are both
included: one-year immutable caching on assets, no-cache on HTML, `nosniff`,
frame options, referrer policy, and the 404 mapping. Neither is needed on
GitHub Pages, which handles 404s automatically from `404.html`.

---

## 9. The loader and the film

### Loader

Mirrors the brand splash: logo, blue rule, "Remapping · Diagnostics · ECU
Tuning", the domain, and a sweeping progress bar.

It runs **on the first load of a browsing session, and again every time the
home button is pressed** — that's the logo in the header and any `#home` link.
The element is never removed from the DOM so it can be replayed; the CSS
animations are restarted by forcing a reflow. Pressing home also scrolls back
to the top.

Safeguards: a hard timeout always dismisses it, clicking it skips it, and under
`prefers-reduced-motion` the entry animations are dropped and the display
shortened.

### Film

Your brand animation, converted from the HEVC `.mov` (which plays only in
Safari) to MP4 + WebM — 2.6 MB down to 575 KB.

**It plays by itself when scrolled into view** and pauses when it leaves.
Autoplay is muted, because every browser requires that; there's an unmute
button on the video. If autoplay is refused anyway — iOS Low Power Mode, data
saver, a strict browser setting — the play button appears instead, so the video
is never simply dead. Under `prefers-reduced-motion` it won't autoplay at all
and offers the button.

Verified under the browser's default autoplay policy, not a relaxed test flag.

### Cache busting

Every local CSS, JS, video and poster reference carries `?v=3`. Browsers treat
a changed query string as a new file, so nobody gets served a stale script that
would break the autoplay or the loader.

**When you change any asset, bump that number** — search and replace `?v=3`
with `?v=4` across the four HTML files. Without it, returning visitors can sit
on cached copies for up to a year, because `_headers` and `.htaccess` set
long cache lifetimes on `/assets/*` (which is what makes the site fast).

## 10. What this site costs to run

Nothing, on the setup described here.

| Item | Cost |
|---|---|
| Hosting (GitHub Pages or Cloudflare Pages) | Free |
| SSL certificate | Free, automatic |
| Google Fonts | Free |
| Analytics (Cloudflare or GA4) | Free |
| Google Business Profile | Free |
| Domain name | ~£10/year, if you don't already own it |

Two **optional** extras would cost money and are switched off:

- **Real reg lookup.** The DVLA API is free but returns no model or power
  figures, so it needs a paid data provider on top (per-lookup pricing). The
  vehicle picker does the same job for free and is what's live.
- **Plausible analytics.** ~£7/month. Cloudflare and GA4 do the job free.

---

## 11. Deploying

Any static host: Netlify, Cloudflare Pages, Vercel, GitHub Pages, or plain
FTP to shared hosting. Drag the folder in, point the domain at it, done.
Nothing needs a server except the optional reg-lookup worker.
