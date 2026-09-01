/* ═══════════════════════════════════════════════════════════════
   JM PERFORMANCE — cookie consent + analytics
   ---------------------------------------------------------------
   Nothing loads and no cookie is set until the visitor agrees.
   That is what UK PECR requires: analytics is not "strictly
   necessary", so consent comes before it runs, not after.

   ALL OPTIONS BELOW ARE OFF. The site runs perfectly like this —
   no analytics, no cookies, and no cookie banner, because with
   nothing set there is genuinely nothing to consent to.

   Fill in ONE to turn numbers on. The banner appears by itself
   the moment you do.

     ga4Id        Google Analytics 4.  FREE.  Most detail, ties in
                  with Google Business Profile.
                  analytics.google.com → Admin → Data streams.

     cfToken      Cloudflare Web Analytics.  FREE.  No cookies,
                  unlimited. Easiest if you host on Cloudflare
                  Pages. dash.cloudflare.com → Analytics & Logs →
                  Web Analytics → Add a site, copy the token.

     plausible    Plausible.  PAID, about £7/month. Listed only
                  for completeness — the two above are free.
   ═══════════════════════════════════════════════════════════════ */

const ANALYTICS = {
  ga4Id     : null,   // 'G-XXXXXXXXXX'          FREE
  cfToken   : null,   // 'abc123...'             FREE
  plausible : null    // 'jmperformance.co.uk'   PAID
};

(function () {
  const KEY = 'jmCookieChoice';
  const bar = document.getElementById('cookieBar');

  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const put = (v) => { try { localStorage.setItem(KEY, v); } catch (e) {} };

  /* Anything here sets cookies or otherwise needs asking first. */
  const needsConsent = Boolean(ANALYTICS.ga4Id || ANALYTICS.plausible);

  let loaded = false;
  function loadAnalytics() {
    if (loaded) return;
    loaded = true;

    if (ANALYTICS.ga4Id) {
      const g = document.createElement('script');
      g.async = true;
      g.src = 'https://www.googletagmanager.com/gtag/js?id=' + ANALYTICS.ga4Id;
      document.head.appendChild(g);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', ANALYTICS.ga4Id, { anonymize_ip: true });
    }

    if (ANALYTICS.plausible) {
      const p = document.createElement('script');
      p.defer = true;
      p.setAttribute('data-domain', ANALYTICS.plausible);
      p.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(p);
    }
  }

  function show() { if (bar) bar.hidden = false; }
  function hide() { if (bar) bar.hidden = true; }

  /* Cloudflare Web Analytics sets no cookies and stores no personal
     data, so it does not require consent and can load immediately. */
  if (ANALYTICS.cfToken) {
    const cf = document.createElement('script');
    cf.defer = true;
    cf.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    cf.setAttribute('data-cf-beacon', JSON.stringify({ token: ANALYTICS.cfToken }));
    document.head.appendChild(cf);
  }

  /* Hide the footer "Cookie settings" link when there is nothing to settle. */
  if (!needsConsent) {
    document.querySelectorAll('[data-cookie-reopen]').forEach(el => {
      const wrap = el.closest('p');
      el.hidden = true;
      if (wrap && wrap.textContent.trim().startsWith('·')) wrap.hidden = true;
    });
    return;
  }

  const choice = get();
  if (choice === 'all') loadAnalytics();
  else if (choice !== 'essential') show();

  const accept = document.getElementById('cookieAccept');
  const reject = document.getElementById('cookieReject');
  if (accept) accept.addEventListener('click', () => { put('all'); loadAnalytics(); hide(); });
  if (reject) reject.addEventListener('click', () => { put('essential'); hide(); });

  document.querySelectorAll('[data-cookie-reopen]').forEach(btn =>
    btn.addEventListener('click', (e) => { e.preventDefault(); show(); })
  );
})();
