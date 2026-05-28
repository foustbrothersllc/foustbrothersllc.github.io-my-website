/* js/main.js — Navigation, clock, ticker, forms, page routing */

// ── NAVIGATION ──
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  // Close mobile menu
  document.querySelector('.nav-links').classList.remove('open');

  window.scrollTo(0, 0);

  try { history.pushState({ page }, '', page === 'home' ? '/' : '/' + page); } catch(e) {}

  setTimeout(initStamps, 150);
}

window.addEventListener('popstate', (e) => {
  if (e.state && e.state.page) navigate(e.state.page);
});

// ── MOBILE NAV TOGGLE ──
document.querySelector('.nav-toggle').addEventListener('click', function () {
  document.querySelector('.nav-links').classList.toggle('open');
});

// Close mobile nav when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('open');
  });
});

// ── LIVE CLOCK ──
(function () {
  function updateClock() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    var el = document.getElementById('navClock');
    if (el) el.textContent = h + ':' + m + ':' + s;
  }
  updateClock();
  setInterval(updateClock, 1000);
})();

// ── SEAMLESS TICKER ──
(function () {
  var inner = document.querySelector('.ticker-inner');
  if (!inner) return;
  var pos = 0;
  var speed = 0.4;
  function tick() {
    pos -= speed;
    if (-pos >= inner.scrollWidth / 2) pos = 0;
    inner.style.transform = 'translateX(' + pos + 'px)';
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ── QUALITY BADGE STAMP ──
var stampObserver = new IntersectionObserver((entries) => {
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

// ── SERVICE CARD → WORK ORDER ──
function selectService(value) {
  navigate('work-order');
  setTimeout(() => {
    const sel = document.getElementById('serviceType');
    if (sel) {
      sel.value = value;
      sel.dispatchEvent(new Event('change'));
      sel.closest('.form-group').scrollIntoView({ behavior: 'smooth', block: 'center' });
      sel.style.borderColor = 'var(--cyan)';
      sel.style.boxShadow = '0 0 0 1px var(--cyan-dim), inset 0 0 10px var(--cyan-glow)';
      setTimeout(() => { sel.style.borderColor = ''; sel.style.boxShadow = ''; }, 2000);
    }
  }, 150);
}

// ── WORK ORDER FORM SUBMIT ──
document.getElementById('workOrderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('.form-submit');
  btn.innerHTML = 'TRANSMITTING...';
  btn.disabled = true;
  const formData = new FormData(e.target);
  formData.append('access_key', 'e9d0aa34-4229-4f32-bec4-02b98db6c0e9');
  formData.append('subject', 'New Work Order — Foust Brothers LLC');
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST', body: formData, headers: { Accept: 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      btn.innerHTML = '✓ REQUEST TRANSMITTED';
      btn.classList.add('success');
      document.getElementById('successMsg').classList.add('show');
      e.target.reset();
    } else { btn.innerHTML = 'ERROR — RETRY'; btn.disabled = false; }
  } catch {
    btn.innerHTML = 'ERROR — RETRY';
    btn.disabled = false;
  }
});

// ── PHONE FORMATTING ──
const phoneInput = document.getElementById('phone');
if (phoneInput) {
  phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 6) {
      value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6,10)}`;
    } else if (value.length >= 3) {
      value = `(${value.slice(0,3)}) ${value.slice(3)}`;
    }
    e.target.value = value;
  });
}

// ── AUTO YEAR ──
document.querySelectorAll('#footerYear').forEach(el => el.textContent = new Date().getFullYear());

// ── INITIAL PAGE LOAD: show correct page based on URL ──
(function () {
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
  const validPages = ['about', 'billing', 'work-order', 'privacy', 'terms'];
  if (validPages.includes(path)) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + path).classList.add('active');
    document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
      a.classList.toggle('active', a.dataset.page === path);
    });
  }
  try { history.replaceState({ page: path || 'home' }, '', window.location.pathname); } catch(e) {}
})();
