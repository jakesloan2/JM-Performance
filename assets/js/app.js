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
     Leave null and the checker falls back to the manual vehicle
     picker (still fully functional).
     Set it to your own server route (see /dvla-proxy-worker.js and
     README.md) to turn on true registration lookup.                 */
  lookupEndpoint : null,

  /* Where the contact form posts. Leave null for a mailto: fallback.
     Works out of the box with Formspree, Basin, Netlify Forms etc.   */
  formEndpoint : null
};

/* ═══════════════════════════════════════════════════════════════
   LOADER
   Shows once per browsing session. Always dismisses — a hard
   timeout means a slow asset can never leave someone stuck on it.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const el = document.getElementById('loader');
  if (!el) return;

  let seen = false;
  try { seen = sessionStorage.getItem('jmSeenLoader') === '1'; } catch (e) { /* private mode */ }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (seen) { el.remove(); return; }

  document.body.classList.add('is-loading');
  let done = false;
  const dismiss = () => {
    if (done) return;
    done = true;
    try { sessionStorage.setItem('jmSeenLoader', '1'); } catch (e) {}
    el.classList.add('is-done');
    document.body.classList.remove('is-loading');
    setTimeout(() => el.remove(), 700);
  };

  const minShow = reduce ? 0 : 1400;
  const start = performance.now();
  const finish = () => setTimeout(dismiss, Math.max(0, minShow - (performance.now() - start)));

  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish, { once: true });

  setTimeout(dismiss, 4000);            // hard ceiling
  el.addEventListener('click', dismiss); // let people skip it
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

els.regGo.addEventListener('click', async () => {
  const raw = els.regInput.value.trim();
  if (!raw)            return regFail('Enter your registration to see your figures.');
  if (!isValidReg(raw)) return regFail("That doesn't look like a UK registration. Check and try again.");

  pendingReg = prettyReg(raw);
  els.regGo.disabled = true;
  els.regGo.textContent = 'Checking…';

  try {
    const vehicle = await lookupReg(cleanReg(raw));
    if (vehicle && vehicle.matched) {
      renderResults(vehicle, pendingReg);
    } else {
      handoffToPicker(vehicle);
    }
  } catch (err) {
    console.warn('Reg lookup failed:', err);
    handoffToPicker(null);
  } finally {
    els.regGo.disabled = false;
    els.regGo.innerHTML = 'Go <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
});

/**
 * Look up a registration.
 * With CONFIG.lookupEndpoint set, POSTs { registrationNumber } and expects:
 *   { make, model, engine, fuelType, yearOfManufacture, enginePowerBhp, enginePowerNm }
 * Returns an object with matched:true when there's enough to calculate figures.
 */
async function lookupReg(reg) {
  if (!CONFIG.lookupEndpoint) return null;

  const res = await fetch(CONFIG.lookupEndpoint, {
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify({ registrationNumber: reg })
  });
  if (!res.ok) throw new Error('Lookup returned ' + res.status);
  const d = await res.json();

  const type = inferType(d);
  const bhp  = Number(d.enginePowerBhp) || null;
  const nm   = Number(d.enginePowerNm)  || (bhp ? Math.round(bhp * (type === 'td' ? 2.2 : 1.5)) : null);

  if (!bhp || !nm) {
    return { matched: false, make: d.make || null, year: d.yearOfManufacture || null, raw: d };
  }
  return {
    matched : true,
    title   : [d.yearOfManufacture, d.make, d.model, d.engine].filter(Boolean).join(' '),
    bhp, nm, type
  };
}

function inferType(d) {
  const fuel = (d.fuelType || '').toUpperCase();
  const eng  = (d.engine || d.model || '').toUpperCase();
  const diesel = fuel.includes('DIESEL') || /TDI|HDI|CDTI|DCI|TDCI|CRDI|BLUEHDI|MULTIJET|D-4D|SKYACTIV-D|ECOBLUE/.test(eng);
  const forced = /TURBO|TSI|TFSI|TDI|HDI|CDTI|DCI|TDCI|CRDI|T-GDI|ECOBOOST|THP|TCE|MULTIJET|BITURBO|SUPERCHARGED/.test(eng)
                 || diesel;
  if (diesel) return forced ? 'td' : 'nad';
  return forced ? 'tp' : 'na';
}

function handoffToPicker(partial) {
  showTab('select');
  const note = partial && partial.make
    ? `We found ${pendingReg}${partial.year ? ' (' + partial.year + ')' : ''}. Confirm the model and engine below.`
    : `We've got ${pendingReg}. Pick your make, model and engine to see your figures.`;
  els.panelSel.querySelector('.checker-lede').textContent = note;

  if (partial && partial.make) {
    const match = Object.keys(window.JM_VEHICLES)
      .find(m => m.toUpperCase().replace(/[^A-Z]/g, '').includes(partial.make.toUpperCase().replace(/[^A-Z]/g, '')));
    if (match) { els.selMake.value = match; els.selMake.dispatchEvent(new Event('change')); }
  }
  els.selMake.focus();
}

/* ── vehicle picker ── */
const DB = window.JM_VEHICLES || {};
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
   Nothing downloads until the section is in view, and playback
   only starts when asked — so the video never costs a visitor
   bandwidth they didn't want to spend.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const video = $('#introVideo');
  const play  = $('#filmPlay');
  const sound = $('#filmSound');
  if (!video || !play) return;

  let loaded = false;
  const load = () => { if (!loaded) { loaded = true; video.preload = 'metadata'; video.load(); } };

  if ('IntersectionObserver' in window) {
    const vo = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { load(); vo.disconnect(); } });
    }, { rootMargin: '300px' });
    vo.observe(video);
  } else load();

  play.addEventListener('click', () => {
    load();
    video.play().then(() => {
      play.hidden = true;
      sound.hidden = false;
      video.controls = true;
    }).catch(() => { video.controls = true; });
  });

  const frame = video.closest('.film-frame');
  video.addEventListener('pause', () => { if (!video.ended) play.hidden = false; });
  video.addEventListener('play',  () => {
    play.hidden = true; sound.hidden = false;
    if (frame) frame.classList.add('is-playing');
  });

  sound.addEventListener('click', () => {
    video.muted = !video.muted;
    sound.classList.toggle('is-on', !video.muted);
    sound.setAttribute('aria-label', video.muted ? 'Unmute the film' : 'Mute the film');
  });
})();
