/* ═══════════════════════════════════════════════════════════════
   JM PERFORMANCE — app.js
   Edit CONFIG below. Everything else can be left alone.
   ═══════════════════════════════════════════════════════════════ */

const CONFIG = {
  /* Business details — these are written into every phone/email link
     on the page, so change them once here.                          */
  phoneDisplay : '07801 265432',
  phoneDial    : '+447801265432',

  /* Mobile number — used by the sticky bar and the "send details" button. */
  mobileDisplay : '07801 265432',
  mobileDial    : '+447801265432',

  /* How the "send details" button delivers the message.
     'whatsapp' opens WhatsApp with the text ready to send — most reliable.
     'sms'      opens the normal texting app instead.                       */
  messageChannel : 'whatsapp',

  email        : 'Joshmcmaster1234@gmail.com',

  /* Google review link. Get it from your Google Business Profile:
     Read reviews → Get more reviews → copy the short link.
     Leave null and the review button is hidden.                     */
  reviewUrl : null,

  /* Reg lookup endpoint.
     'api/lookup' is the Cloudflare Pages Function in /functions — it
     goes live automatically when the site is hosted on Cloudflare
     Pages and the DVLA key is added as a secret (see README §3).
     On any host without it (GitHub Pages, plain FTP) the call 404s
     and the checker quietly falls back to the manual picker.        */
  lookupEndpoint : 'api/lookup',

  /* Fire the lookup automatically once a valid reg has been typed,
     without needing the Go button. Set false to require Go.         */
  autoLookup : true,

  /* Where the contact form posts. Leave null for a mailto: fallback.
     Works out of the box with Formspree, Basin, Netlify Forms etc.   */
  formEndpoint : null
};

/* ═══════════════════════════════════════════════════════════════
   LOADER
   Runs on first load of a session, and again any time the home
   button is pressed. The element is never removed from the DOM so
   it can be replayed. A hard timeout means a slow asset can never
   leave anyone stuck looking at it.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const el = document.getElementById('loader');
  if (!el) return;

  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; };

  function dismiss() {
    clear();
    el.classList.add('is-done');
    el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-loading');
  }

  function run(minShow) {
    clear();
    el.classList.remove('is-done');
    el.removeAttribute('aria-hidden');
    document.body.classList.add('is-loading');

    // restart the CSS entry animations
    el.querySelectorAll('.loader-logo,.loader-rule,.loader-tag,.loader-url').forEach(n => {
      n.style.animation = 'none';
      void n.offsetWidth;          // force reflow so the animation replays
      n.style.animation = '';
    });

    timers.push(setTimeout(dismiss, minShow));
    timers.push(setTimeout(dismiss, minShow + 2600));   // hard ceiling
  }

  el.addEventListener('click', dismiss);   // always skippable

  /* ── first load of the session ── */
  let seen = false;
  try { seen = sessionStorage.getItem('jmSeenLoader') === '1'; } catch (e) { /* private mode */ }

  if (seen) {
    dismiss();
  } else {
    try { sessionStorage.setItem('jmSeenLoader', '1'); } catch (e) {}
    const minShow = reduce() ? 300 : 1600;
    document.body.classList.add('is-loading');
    const start = performance.now();
    const finish = () => run(Math.max(300, minShow - (performance.now() - start)));
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    timers.push(setTimeout(dismiss, 4000));
  }

  /* ── replay whenever Home is pressed ── */
  function replay(e) {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' });
    run(reduce() ? 300 : 1600);
  }

  document.querySelectorAll('.brand, a[href="#home"]').forEach(a =>
    a.addEventListener('click', replay)
  );

  window.JMLoader = { replay, dismiss };
})();

/* ─────────────── helpers ─────────────── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ─────────────── contact details ─────────────── */
$$('[data-phone-link]').forEach(a => { a.href = 'tel:' + CONFIG.phoneDial; });
$$('[data-phone-text]').forEach(a => { a.textContent = CONFIG.phoneDisplay; });
$$('[data-mobile-link]').forEach(a => { if (a.tagName === 'A' && !a.dataset.msgLink) a.href = 'tel:' + CONFIG.mobileDial; });
$$('[data-mobile-text]').forEach(a => { a.textContent = CONFIG.mobileDisplay + ' (mobile)'; });
$$('[data-email-link]').forEach(a => { a.href = 'mailto:' + CONFIG.email; a.textContent = CONFIG.email; });
$$('[data-review-link]').forEach(a => {
  if (CONFIG.reviewUrl) { a.href = CONFIG.reviewUrl; a.target = '_blank'; a.rel = 'noopener'; }
  else a.hidden = true;
});
const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ─────────────── header / nav ─────────────── */
const header = $('#siteHeader');
const burger = $('#burger');
const mobileNav = $('#mobileNav');

burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') === 'true';
  burger.setAttribute('aria-expanded', String(!open));
  burger.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
  mobileNav.hidden = open;
});

$$('#mobileNav a').forEach(a => a.addEventListener('click', () => {
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Open menu');
  mobileNav.hidden = true;
}));

const callBar = $('#mobileBar');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle('is-stuck', y > 12);
  if (callBar) callBar.classList.toggle('is-visible', y > 620);
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ─────────────── scroll reveal ─────────────── */
const revealTargets = $$('.card, .review, .area-col, .about-panel, .stat, .contact-form');
revealTargets.forEach(el => el.classList.add('reveal'));

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        if (e.target.classList.contains('stat')) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px' })
  : null;

if (io) revealTargets.forEach(el => io.observe(el));
else revealTargets.forEach(el => el.classList.add('is-in'));

function countUp(stat) {
  const el = stat.querySelector('[data-count]');
  if (!el || el.dataset.done) return;
  el.dataset.done = '1';
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = target.toLocaleString('en-GB') + suffix;
    return;
  }
  const dur = 1400, t0 = performance.now();
  const tick = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString('en-GB') + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ═══════════════════════════════════════════════════════════════
   "SEND DETAILS" MESSAGE
   Builds a ready-to-send message with the enquiry fields laid out.
   Anything the visitor has already typed (or picked in the checker)
   is filled in; the rest is left blank for them to complete on their
   phone before hitting send.
   ═══════════════════════════════════════════════════════════════ */

const MSG_FIELDS = [
  ['Your name',    () => val('#cfName')],
  ['Phone',        () => val('#cfPhone')],
  ['Email',        () => val('#cfEmail')],
  ['Registration', () => val('#cfReg')],
  ['Your town',    () => val('#cfTown')],
  ['What I\u2019m after', () => val('#cfService')],
  ['Anything else', () => val('#cfMsg')]
];

function val(sel) {
  const el = $(sel);
  return el && el.value ? el.value.trim() : '';
}

function buildMessage() {
  const lines = ['Hi JM Performance, I\u2019d like a quote.', ''];
  MSG_FIELDS.forEach(([label, get]) => lines.push(label + ': ' + get()));
  return lines.join('\n');
}

function sendHref(text) {
  if (CONFIG.messageChannel === 'sms') {
    return 'sms:' + CONFIG.mobileDial + '?&body=' + encodeURIComponent(text);
  }
  return 'https://wa.me/' + CONFIG.mobileDial.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(text);
}

function messageHref() { return sendHref(buildMessage()); }

/* Message built from a checker result — carries the vehicle and all three
   sets of figures, then leaves the customer's own details to fill in. */
function vehicleMessage(r) {
  const lines = ['Hi JM Performance, I\u2019d like to book this map.', ''];
  if (r.reg) lines.push('Reg: ' + r.reg);
  lines.push('Vehicle: ' + r.title, '');
  lines.push('Standard: ' + r.stock.bhp + ' bhp / ' + r.stock.nm + ' Nm');
  lines.push('Stage 1: ' + r.s1.bhp + ' bhp / ' + r.s1.nm + ' Nm  (+' + (r.s1.bhp - r.stock.bhp) + ' bhp)');
  lines.push('Stage 2: ' + r.s2.bhp + ' bhp / ' + r.s2.nm + ' Nm  (+' + (r.s2.bhp - r.stock.bhp) + ' bhp)');
  lines.push('', 'Which stage: ', 'Your name: ', 'Phone: ', 'Your town: ', 'Anything else: ');
  return lines.join('\n');
}

const msgLinks = $$('[data-msg-link]');
function refreshMessageLinks() { msgLinks.forEach(a => { a.href = messageHref(); }); }
refreshMessageLinks();

/* Keep the message in step with whatever they type or select */
['input', 'change'].forEach(ev =>
  document.addEventListener(ev, (e) => {
    if (e.target.closest && e.target.closest('#contactForm')) refreshMessageLinks();
  }, true)
);

/* ═══════════════════════════════════════════════════════════════
   REG CHECKER
   ═══════════════════════════════════════════════════════════════ */

const els = {
  tabs      : $$('.checker-tab'),
  panelReg  : $('#panel-reg'),
  panelSel  : $('#panel-select'),
  plateWrap : $('#plateWrap'),
  regInput  : $('#regInput'),
  regGo     : $('#regGo'),
  regError  : $('#regError'),
  selMake   : $('#selMake'),
  selModel  : $('#selModel'),
  selEngine : $('#selEngine'),
  selGo     : $('#selGo'),
  results   : $('#results'),
  resReg    : $('#resultReg'),
  resVeh    : $('#resultVehicle'),
  resTable  : $('#resultTable'),
  resEcon   : $('#resultEconomy'),
  bookMap   : $('#bookMap'),
  reset     : $('#resetChecker')
};

let pendingReg = null;   // reg carried over from the plate into the picker
let lastResult = null;   // most recent set of figures, for the booking message

/* ── tabs ── */
function showTab(name) {
  els.tabs.forEach(t => {
    const on = t.dataset.tab === name;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
  });
  els.panelReg.classList.toggle('is-active', name === 'reg');
  els.panelReg.hidden = name !== 'reg';
  els.panelSel.classList.toggle('is-active', name === 'select');
  els.panelSel.hidden = name !== 'select';
}
els.tabs.forEach(t => t.addEventListener('click', () => { showTab(t.dataset.tab); }));
showTab('reg');

/* ── UK registration validation ── */
const REG_PATTERNS = [
  /^[A-Z]{2}[0-9]{2}[A-Z]{3}$/,        // current   AA00 AAA
  /^[A-Z][0-9]{1,3}[A-Z]{3}$/,          // prefix    A000 AAA
  /^[A-Z]{3}[0-9]{1,3}[A-Z]$/,          // suffix    AAA 000A
  /^[A-Z]{1,3}[0-9]{1,4}$/,             // NI / dateless   AAZ 1234
  /^[0-9]{1,4}[A-Z]{1,3}$/              // reversed dateless
];

const cleanReg = (v) => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const isValidReg = (v) => REG_PATTERNS.some(re => re.test(cleanReg(v)));

function prettyReg(v) {
  const r = cleanReg(v);
  if (/^[A-Z]{2}[0-9]{2}[A-Z]{3}$/.test(r)) return r.slice(0, 4) + ' ' + r.slice(4);
  if (/^[A-Z]{1,3}[0-9]{1,4}$/.test(r))     return r.replace(/^([A-Z]{1,3})([0-9]{1,4})$/, '$1 $2');
  if (/^[A-Z][0-9]{1,3}[A-Z]{3}$/.test(r))  return r.replace(/^([A-Z][0-9]{1,3})([A-Z]{3})$/, '$1 $2');
  if (/^[A-Z]{3}[0-9]{1,3}[A-Z]$/.test(r))  return r.replace(/^([A-Z]{3})([0-9]{1,3}[A-Z])$/, '$1 $2');
  return r;
}

/* Age identifier → registration year (current-style plates only) */
function yearFromReg(reg) {
  const r = cleanReg(reg);
  const m = r.match(/^[A-Z]{2}([0-9]{2})[A-Z]{3}$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n <= 50 ? 2000 + n : 2000 + (n - 50);
}

els.regInput.addEventListener('input', () => {
  const pos = els.regInput.selectionStart;
  els.regInput.value = els.regInput.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  els.regInput.setSelectionRange(pos, pos);
  els.plateWrap.classList.remove('is-invalid');
  els.regError.hidden = true;
});
els.regInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); els.regGo.click(); } });

function regFail(msg) {
  els.plateWrap.classList.add('is-invalid');
  els.regError.textContent = msg;
  els.regError.hidden = false;
  els.regInput.focus();
}

const DB = window.JM_VEHICLES || {};
const GO_LABEL = els.regGo.innerHTML;
let lookupSeq = 0;

async function runLookup() {
  const raw = els.regInput.value.trim();
  if (!raw)             return regFail('Enter your registration to see your figures.');
  if (!isValidReg(raw)) return regFail("That doesn't look like a UK registration. Check and try again.");

  const seq = ++lookupSeq;
  pendingReg = prettyReg(raw);
  els.regGo.disabled = true;
  els.regGo.textContent = 'Checking…';
  els.regError.hidden = true;

  try {
    const found = await lookupReg(cleanReg(raw));
    if (seq !== lookupSeq) return;                 // a newer lookup superseded this one
    resolveFromLookup(found);
  } catch (err) {
    console.warn('Reg lookup:', err);
    if (seq !== lookupSeq) return;
    handoffToPicker(null);
  } finally {
    if (seq === lookupSeq) { els.regGo.disabled = false; els.regGo.innerHTML = GO_LABEL; }
  }
}

els.regGo.addEventListener('click', runLookup);

/* Auto-run once typing pauses on a valid reg */
let autoTimer = null;
els.regInput.addEventListener('input', () => {
  if (!CONFIG.autoLookup) return;
  clearTimeout(autoTimer);
  const v = cleanReg(els.regInput.value);
  if (v.length >= 6 && isValidReg(v)) autoTimer = setTimeout(runLookup, 900);
});

/**
 * Ask the server what the DVLA knows about this reg.
 * Returns null when there is no endpoint (or it 404s) so the caller
 * falls back to the manual picker without fuss.
 */
async function lookupReg(reg) {
  if (!CONFIG.lookupEndpoint) return null;
  let res;
  try {
    res = await fetch(CONFIG.lookupEndpoint, {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify({ registrationNumber: reg })
    });
  } catch (e) { return null; }                     // offline / blocked
  if (res.status === 404 && !(res.headers.get('content-type') || '').includes('json')) return null; // no function here
  if (res.status === 404) return { notFound: true };
  if (!res.ok) return null;
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) return null;
  return res.json();
}

/* ───────────────────────────────────────────────────────────────
   Narrow the database using whatever the DVLA gave us.
   make + year + fuel + engine size is usually enough to land on
   one engine, or a very short list.
   ─────────────────────────────────────────────────────────────── */
function fuelIsDiesel(f) { return /DIESEL/i.test(f || ''); }
function typeIsDiesel(t) { return t === 'td' || t === 'nad'; }

function modelYears(label) {
  const m = label.match(/\((\d{4})(?:[–-](\d{4}))?/);
  if (!m) return null;
  return { from: +m[1], to: m[2] ? +m[2] : 2100 };
}

function engineLitres(label) {
  const m = label.match(/(\d\.\d)/);
  return m ? parseFloat(m[1]) : null;
}

function matchMake(dvlaMake) {
  const key = (dvlaMake || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) return null;
  const aliases = { VOLKSWAGEN: 'Volkswagen', VW: 'Volkswagen', MERCEDES: 'Mercedes-Benz', MERCEDESBENZ: 'Mercedes-Benz',
                    SKODA: 'Škoda', CITROEN: 'Citroën', LANDROVER: 'Land Rover', RANGEROVER: 'Land Rover',
                    CUPRA: 'SEAT', DS: 'Citroën', VAUXHALL: 'Vauxhall', OPEL: 'Vauxhall' };
  if (aliases[key]) return aliases[key];
  return Object.keys(DB).find(m => m.toUpperCase().replace(/[^A-Z]/g, '') === key)
      || Object.keys(DB).find(m => key.includes(m.toUpperCase().replace(/[^A-Z]/g, '')))
      || null;
}

function narrow(d) {
  const make = matchMake(d.make);
  if (!make) return { make: null, candidates: [] };

  const year   = Number(d.yearOfManufacture) || null;
  const diesel = fuelIsDiesel(d.fuelType);
  const cc     = Number(d.engineCapacity) || null;
  const litres = cc ? Math.round(cc / 100) / 10 : null;

  let cands = [];
  Object.keys(DB[make]).forEach(model => {
    const yrs = modelYears(model);
    if (year && yrs && (year < yrs.from - 1 || year > yrs.to + 1)) return;   // ±1 for reg-vs-build lag
    DB[make][model].forEach((eng, i) => {
      if (d.fuelType && typeIsDiesel(eng[3]) !== diesel) return;
      cands.push({ make, model, idx: i, label: eng[0], litres: engineLitres(eng[0]) });
    });
  });

  if (litres) {
    const tight = cands.filter(c => c.litres === null || Math.abs(c.litres - litres) < 0.15);
    if (tight.length) cands = tight;
  }
  return { make, year, litres, diesel, candidates: cands };
}

function resolveFromLookup(found) {
  if (!found || found.notFound || !found.make) return handoffToPicker(found);

  const n = narrow(found);
  if (!n.make) return handoffToPicker(found);

  const desc = [n.year, n.make, n.litres ? n.litres.toFixed(1) : null, found.fuelType ? found.fuelType.toLowerCase() : null]
                 .filter(Boolean).join(' ');

  if (n.candidates.length === 1) {
    const c = n.candidates[0];
    const [label, bhp, nm, type] = DB[c.make][c.model][c.idx];
    return renderResults({ matched: true, title: `${c.make} ${c.model.replace(/\s*\(.*\)$/, '')} ${label}`, bhp, nm, type }, pendingReg);
  }

  /* a short list — pre-fill make, restrict the model list, let them tap the right one */
  showTab('select');
  els.panelSel.querySelector('.checker-lede').textContent =
    n.candidates.length
      ? `${pendingReg} is a ${desc}. Which one is yours?`
      : `${pendingReg} is a ${desc}. Pick the model and engine below.`;

  els.selMake.value = n.make;
  els.selMake.dispatchEvent(new Event('change'));

  if (n.candidates.length) {
    const models = [...new Set(n.candidates.map(c => c.model))];
    [...els.selModel.options].forEach(o => { if (o.value && o.value !== '__other' && !models.includes(o.value)) o.hidden = true; });
    if (models.length === 1) {
      els.selModel.value = models[0];
      els.selModel.dispatchEvent(new Event('change'));
      const idxs = n.candidates.map(c => String(c.idx));
      [...els.selEngine.options].forEach(o => { if (o.value && !idxs.includes(o.value)) o.hidden = true; });
      els.selEngine.focus();
    } else {
      els.selModel.focus();
    }
  } else {
    els.selModel.focus();
  }
}

function handoffToPicker(partial) {
  showTab('select');
  const make = partial && partial.make ? matchMake(partial.make) : null;
  els.panelSel.querySelector('.checker-lede').textContent =
    partial && partial.notFound
      ? `The DVLA has no record of ${pendingReg}. Check the plate, or pick your vehicle below.`
      : make
        ? `We found ${pendingReg}${partial.yearOfManufacture ? ' (' + partial.yearOfManufacture + ')' : ''}. Confirm the model and engine below.`
        : `We've got ${pendingReg}. Pick your make, model and engine to see your figures.`;
  if (make) { els.selMake.value = make; els.selMake.dispatchEvent(new Event('change')); els.selModel.focus(); }
  else els.selMake.focus();
}

/* ── vehicle picker ── */
const SEL_GO_LABEL = els.selGo.innerHTML;

Object.keys(DB).sort((a, b) => a.localeCompare(b, 'en')).forEach(make => {
  els.selMake.append(new Option(make, make));
});

els.selMake.addEventListener('change', () => {
  const make = els.selMake.value;
  els.selGo.innerHTML = SEL_GO_LABEL;
  els.selModel.innerHTML = '<option value="">Choose model…</option>';
  els.selEngine.innerHTML = '<option value="">Choose engine…</option>';
  els.selEngine.disabled = true;
  els.selGo.disabled = true;
  if (!make) { els.selModel.disabled = true; return; }
  Object.keys(DB[make]).forEach(model => els.selModel.append(new Option(model, model)));
  els.selModel.append(new Option('Mine isn\u2019t listed \u2014 ask us', '__other'));
  els.selModel.disabled = false;
});

els.selModel.addEventListener('change', () => {
  const { value: make } = els.selMake, model = els.selModel.value;
  els.selEngine.innerHTML = '<option value="">Choose engine…</option>';
  els.selGo.disabled = true;
  if (!model) { els.selEngine.disabled = true; return; }
  if (model === '__other') {
    els.selEngine.disabled = true;
    els.selGo.disabled = false;
    els.selGo.innerHTML = 'Send us the details';
    return;
  }
  els.selGo.innerHTML = SEL_GO_LABEL;
  DB[make][model].forEach((eng, i) => els.selEngine.append(new Option(eng[0], String(i))));
  els.selEngine.disabled = false;
});

els.selEngine.addEventListener('change', () => { els.selGo.disabled = els.selEngine.value === ''; });

els.selGo.addEventListener('click', () => {
  const make = els.selMake.value, model = els.selModel.value, idx = els.selEngine.value;

  if (model === '__other') {
    const msg = $('#cfMsg');
    if (pendingReg) $('#cfReg').value = pendingReg;
    msg.value = `My ${make} isn't in the list${pendingReg ? ' (reg ' + pendingReg + ')' : ''}. Can you tell me what's available for it?`;
    refreshMessageLinks();
    $('#contact').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => $('#cfName').focus(), 600);
    return;
  }

  if (!make || !model || idx === '') return;
  const [label, bhp, nm, type] = DB[make][model][idx];
  renderResults({
    matched : true,
    title   : `${make} ${model.replace(/\s*\(.*\)$/, '')} ${label}`,
    subtitle: model.match(/\((.*)\)/) ? model.match(/\((.*)\)/)[1] : '',
    bhp, nm, type
  }, pendingReg);
});

/* ── results ── */
function renderResults(v, reg) {
  const model = window.JM_GAIN_MODEL[v.type] || window.JM_GAIN_MODEL.td;
  const s1 = { bhp: Math.round(v.bhp * (1 + model.s1.bhp)), nm: Math.round(v.nm * (1 + model.s1.nm)) };
  const s2 = { bhp: Math.round(v.bhp * (1 + model.s2.bhp)), nm: Math.round(v.nm * (1 + model.s2.nm)) };
  const peak = s2.bhp;

  els.resReg.textContent = reg || (window.JM_TYPE_LABEL[v.type] || '');
  els.resReg.classList.toggle('is-plate', Boolean(reg));
  els.resReg.hidden = false;
  els.resVeh.textContent = v.title;

  els.resTable.innerHTML = [
    row('Standard', v.bhp, v.nm, null, 'is-stock', peak),
    row('Stage 1',  s1.bhp, s1.nm, `+${s1.bhp - v.bhp} bhp · +${s1.nm - v.nm} Nm`, 'is-s1', peak),
    row('Stage 2',  s2.bhp, s2.nm, `+${s2.bhp - v.bhp} bhp · +${s2.nm - v.nm} Nm`, 'is-s2', peak)
  ].join('');

  els.resEcon.innerHTML =
    `<strong>${window.JM_TYPE_LABEL[v.type]}.</strong> An economy-focused map on this engine typically returns
     <strong>${model.mpg} better mpg</strong> if your driving style stays the same. Stage 2 figures assume
     supporting hardware is fitted.`;

  els.results.hidden = false;
  requestAnimationFrame(() => {
    $$('.result-bar i', els.resTable).forEach(bar => { bar.style.width = bar.dataset.w; });
  });

  lastResult = { title: v.title, reg: reg || '', type: v.type, stock: { bhp: v.bhp, nm: v.nm }, s1, s2 };
  els.bookMap.href = sendHref(vehicleMessage(lastResult));
  $('#bookMapLabel').textContent =
    CONFIG.messageChannel === 'sms' ? 'Book this map by text' : 'Book this map on WhatsApp';
  els.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function row(name, bhp, nm, gain, cls, peak) {
  return `
  <div class="result-row ${cls}">
    <h4>${name}${gain ? `<span class="result-gain">${gain}</span>` : ''}</h4>
    <div class="result-figs">
      <div class="result-fig"><b>${bhp}</b><span>bhp</span></div>
      <div class="result-fig"><b>${nm}</b><span>Nm torque</span></div>
    </div>
    <div class="result-bar"><i data-w="${Math.round((bhp / peak) * 100)}%"></i></div>
  </div>`;
}

els.reset.addEventListener('click', () => {
  els.results.hidden = true;
  pendingReg = null;
  lastResult = null;
  els.regInput.value = '';
  els.selMake.value = ''; els.selMake.dispatchEvent(new Event('change'));
  els.selGo.innerHTML = SEL_GO_LABEL;
  els.panelSel.querySelector('.checker-lede').textContent = 'Pick your make, model and engine';
  showTab('reg');
  els.regInput.focus();
});

/* Fallback path: carry the checked vehicle into the enquiry form instead */
$('#bookMapForm').addEventListener('click', () => {
  if (!lastResult) return;
  if (lastResult.reg) $('#cfReg').value = lastResult.reg;
  const msg = $('#cfMsg');
  if (!msg.value) {
    msg.value =
      `Enquiry about tuning for: ${lastResult.title}\n` +
      `Standard ${lastResult.stock.bhp} bhp / ${lastResult.stock.nm} Nm · ` +
      `Stage 1 ${lastResult.s1.bhp} bhp / ${lastResult.s1.nm} Nm · ` +
      `Stage 2 ${lastResult.s2.bhp} bhp / ${lastResult.s2.nm} Nm`;
  }
  refreshMessageLinks();
});

/* ═══════════════════════════════════════════════════════════════
   CONTACT FORM
   ═══════════════════════════════════════════════════════════════ */
const form = $('#contactForm');
const status = $('#formStatus');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.className = 'form-status';
  status.textContent = '';

  const name  = $('#cfName'), phone = $('#cfPhone'), email = $('#cfEmail');
  let bad = null;

  [name, phone, email].forEach(f => f.removeAttribute('aria-invalid'));

  if (!name.value.trim())  { bad = name;  status.textContent = 'Add your name so we know who we\'re talking to.'; }
  else if (!phone.value.trim()) { bad = phone; status.textContent = 'Add a phone number so we can get back to you.'; }
  else if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    bad = email; status.textContent = 'That email address doesn\'t look right.';
  }

  if (bad) {
    bad.setAttribute('aria-invalid', 'true');
    status.classList.add('is-err');
    bad.focus();
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Sending…';

  try {
    if (CONFIG.formEndpoint) {
      const res = await fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Send failed');
      form.reset();
      status.className = 'form-status is-ok';
      status.textContent = 'Enquiry sent. We\'ll come back to you shortly.';
    } else {
      const body = Object.entries(data)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`).join('\n');
      window.location.href =
        `mailto:${CONFIG.email}?subject=${encodeURIComponent('Tuning enquiry — ' + (data.name || ''))}&body=${encodeURIComponent(body)}`;
      status.className = 'form-status is-ok';
      status.textContent = 'Opening your email app with the enquiry ready to send.';
    }
  } catch (err) {
    status.className = 'form-status is-err';
    status.textContent = `Couldn't send that. Give us a ring on ${CONFIG.phoneDisplay} instead.`;
  } finally {
    btn.disabled = false; btn.textContent = 'Send enquiry';
  }
});


/* ═══════════════════════════════════════════════════════════════
   FILM
   Plays by itself when scrolled into view and pauses when it
   leaves. Muted, which is what every browser requires for
   autoplay. If autoplay is refused anyway (iOS Low Power Mode,
   data saver, a strict setting) the play button is shown instead,
   so the video is never simply dead.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const video = document.getElementById('introVideo');
  const play  = document.getElementById('filmPlay');
  const sound = document.getElementById('filmSound');
  if (!video || !play) return;

  const frame  = video.closest('.film-frame');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  video.muted = true;               // required for autoplay
  video.setAttribute('muted', '');
  video.playsInline = true;

  let userPaused = false;

  function attempt() {
    if (userPaused) return;
    const p = video.play();
    if (p && p.catch) {
      p.then(() => { play.hidden = true; })
       .catch(() => { play.hidden = false; });   // autoplay refused — offer the button
    }
  }

  play.addEventListener('click', () => {
    userPaused = false;
    video.play().then(() => { play.hidden = true; }).catch(() => { video.controls = true; });
  });

  video.addEventListener('play',  () => {
    play.hidden = true;
    sound.hidden = false;
    if (frame) frame.classList.add('is-playing');
  });
  video.addEventListener('pause', () => { if (!video.ended) play.hidden = false; });

  sound.addEventListener('click', () => {
    video.muted = !video.muted;
    sound.classList.toggle('is-on', !video.muted);
    sound.setAttribute('aria-label', video.muted ? 'Unmute the film' : 'Mute the film');
  });

  if (reduce) { play.hidden = false; return; }   // don't autoplay motion for those who opted out

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) attempt();
        else if (!video.paused) { video.pause(); video.muted = true; sound.classList.remove('is-on'); }
      });
    }, { threshold: 0.4 });
    io.observe(video);
  } else {
    video.setAttribute('autoplay', '');
    attempt();
  }
})();
