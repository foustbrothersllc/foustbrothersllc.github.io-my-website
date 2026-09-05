/* ═══════════════════════════════════════════════════════════
   js/main.js — Foust Brothers LLC
   Navigation · Clock · Ticker · Forms
   No backend, no database, no login. Fully static.
═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════
//  CMS — CONTENT LOADER
//  Uses hardcoded content (no backend dependency)
//  Injects into all elements with data-cms attributes
// ═══════════════════════════════════════════

function loadCMSContent() {
  try {
    // Content lives in js/content-data.js — edit that file and redeploy to change it.
    const map = window.HARDCODED_CONTENT || {};

    document.querySelectorAll('[data-cms]').forEach(el => {
      const key = el.getAttribute('data-cms');
      if (map[key] !== undefined && map[key] !== '') el.textContent = map[key];
    });

    // Orb visibility toggle
    const orbContainer = document.querySelector('#page-home .hero-orb-container');
    if (orbContainer) {
      const v = map['hero_visible'];
      const shouldHide = (v === 'false' || v === false || v === '0' || v === 0);
      // Only show orb if NOT hidden
      orbContainer.style.display = shouldHide ? 'none' : 'block';
    }
  } catch(e) {
    console.warn('CMS load failed:', e);
  }
}

loadCMSContent();

// ═══════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  document.querySelector('.nav-links').classList.remove('open');
  window.scrollTo(0, 0);

  try { history.pushState({ page }, '', page === 'home' ? '/' : '/' + page); } catch(e) {}
  setTimeout(initStamps, 150);

  // Re-apply CMS content (hero visibility etc) on every navigation
  loadCMSContent();
}

window.addEventListener('popstate', (e) => {
  if (e.state?.page) navigate(e.state.page);
});

// ── MOBILE NAV ──
document.querySelector('.nav-toggle').addEventListener('click', function () {
  document.querySelector('.nav-links').classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => document.querySelector('.nav-links').classList.remove('open'));
});

// ── LIVE CLOCK ──
(function () {
  function tick() {
    const now = new Date();
    const el = document.getElementById('navClock');
    if (el) el.textContent =
      String(now.getHours()).padStart(2,'0') + ':' +
      String(now.getMinutes()).padStart(2,'0') + ':' +
      String(now.getSeconds()).padStart(2,'0');
  }
  tick(); setInterval(tick, 1000);
})();

// ── TICKER ──
(function () {
  const inner = document.querySelector('.ticker-inner');
  if (!inner) return;
  let pos = 0;
  (function tick() {
    pos -= 0.4;
    if (-pos >= inner.scrollWidth / 2) pos = 0;
    inner.style.transform = `translateX(${pos}px)`;
    requestAnimationFrame(tick);
  })();
})();

// ── QUALITY BADGE STAMPS ──
const stampObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('stamped');
      stampObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

function initStamps() {
  document.querySelectorAll('.quality-badge').forEach(el => {
    el.classList.remove('stamped');
    stampObserver.observe(el);
  });
}
initStamps();

// Also run after a short delay to catch elements already in view on load
setTimeout(initStamps, 500);

// ── SERVICE CARD → WORK ORDER ──
function selectService(value) {
  navigate('work-order');
  setTimeout(() => {
    const sel = document.getElementById('serviceType');
    if (!sel) return;
    sel.value = value;
    sel.dispatchEvent(new Event('change'));
    sel.closest('.form-group').scrollIntoView({ behavior: 'smooth', block: 'center' });
    sel.style.borderColor = 'var(--cyan)';
    sel.style.boxShadow = '0 0 0 1px var(--cyan-dim), inset 0 0 10px var(--cyan-glow)';
    setTimeout(() => { sel.style.borderColor = ''; sel.style.boxShadow = ''; }, 2000);
  }, 150);
}

// ── PHONE FORMATTING ──
const phoneInput = document.getElementById('phone');
if (phoneInput) {
  phoneInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length >= 6) v = `(${v.slice(0,3)}) ${v.slice(3,6)}-${v.slice(6,10)}`;
    else if (v.length >= 3) v = `(${v.slice(0,3)}) ${v.slice(3)}`;
    e.target.value = v;
  });
}

// ── WORK ORDER FORM ──
// Sends directly to Web3Forms (email only). No database, no backend.
document.getElementById('workOrderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('.form-submit');
  btn.innerHTML = 'TRANSMITTING...';
  btn.disabled = true;

  const w3 = new FormData(e.target);
  w3.append('access_key', 'e9d0aa34-4229-4f32-bec4-02b98db6c0e9');
  w3.append('subject', 'New Work Order — Foust Brothers LLC');

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: w3,
      headers: { Accept: 'application/json' }
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Submission failed');

    document.getElementById('successMsg').classList.add('show');
    btn.innerHTML = '✓ REQUEST TRANSMITTED';
    btn.classList.add('success');
    e.target.reset();
  } catch (err) {
    console.error(err);
    btn.innerHTML = 'ERROR — RETRY';
    btn.disabled = false;
  }
});

// ── AUTO YEAR ──
document.querySelectorAll('.footerYear').forEach(el => el.textContent = new Date().getFullYear());

// ── INITIAL PAGE LOAD FROM URL ──
(function () {
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
  const valid = ['about','billing','work-order','privacy','terms'];
  if (valid.includes(path)) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pg = document.getElementById('page-' + path);
    if (pg) pg.classList.add('active');
    document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
      a.classList.toggle('active', a.dataset.page === path);
    });
  }
  try { history.replaceState({ page: path || 'home' }, '', window.location.pathname); } catch(e) {}
})();
