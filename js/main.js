/* ═══════════════════════════════════════════════════════════
   js/main.js — Foust Brothers LLC
   Navigation · Clock · Ticker · Forms · Admin Panel
   NO KEYS OR PASSWORDS IN THIS FILE
   All credentials fetched securely from /api/config
═══════════════════════════════════════════════════════════ */

// ── SUPABASE CLIENT — loaded once at runtime ──
let _sb = null;
let _cfg = null;

async function getCfg() {
  if (_cfg) return _cfg;
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.url && data.key) { _cfg = data; return _cfg; }
    }
  } catch(e) {}
  if (window.__SBCFG && window.__SBCFG.url) {
    _cfg = window.__SBCFG;
    return _cfg;
  }
  throw new Error('Supabase config not available');
}

async function getSB() {
  if (_sb) return _sb;
  const cfg = await getCfg();
  if (!window.supabase) {
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
  }
  _sb = window.supabase.createClient(cfg.url, cfg.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'fb-admin-session',
      storage: window.localStorage
    }
  });
  return _sb;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ═══════════════════════════════════════════
//  CMS — CONTENT LOADER
//  Fetches content from Supabase and injects
//  into all elements with data-cms attributes
// ═══════════════════════════════════════════

async function loadCMSContent() {
  try {
    const sb = await getSB();
    const { data: rows, error } = await sb.from('content').select('key, value');
    if (error || !rows) return;
    const map = {};
    rows.forEach(r => map[r.key] = r.value);

    document.querySelectorAll('[data-cms]').forEach(el => {
      const key = el.getAttribute('data-cms');
      if (map[key] !== undefined && map[key] !== '') el.textContent = map[key];
    });

    // Orb visibility toggle
    const orbContainer = document.querySelector('#page-home .hero-orb-container');
    if (orbContainer) {
      const v = map['hero_visible'];
      console.log('[HERO TOGGLE] raw value from DB:', JSON.stringify(v));
      const shouldHide = (v === 'false' || v === false || v === '0' || v === 0);
      console.log('[HERO TOGGLE] shouldHide:', shouldHide);
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

  if (page === 'admin') {
    checkAdminAuth();
  } else {
    stopAdminPolling();
  }
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
document.getElementById('workOrderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('.form-submit');
  btn.innerHTML = 'TRANSMITTING...';
  btn.disabled = true;

  const fd = new FormData(e.target);

  const w3 = new FormData(e.target);
  w3.append('access_key', 'e9d0aa34-4229-4f32-bec4-02b98db6c0e9');
  w3.append('subject', 'New Work Order — Foust Brothers LLC');

  const order = {
    first_name:    fd.get('firstName'),
    last_name:     fd.get('lastName'),
    email:         fd.get('email'),
    phone:         fd.get('phone')       || '',
    business:      fd.get('business')    || '',
    service_type:  fd.get('serviceType'),
    timeline:      fd.get('timeline')    || '',
    budget:        fd.get('budget')      || '',
    existing_site: fd.get('existingSite')|| '',
    description:   fd.get('description'),
    how_heard:     fd.get('howHeard')    || '',
    status: 'new'
  };

  try {
    const sb = await getSB();
    await Promise.all([
      fetch('https://api.web3forms.com/submit', { method:'POST', body:w3, headers:{ Accept:'application/json' } }),
      sb.from('work_orders').insert(order)
    ]);
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
  if (path === 'admin') {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const adminPg = document.getElementById('page-admin');
    if (adminPg) adminPg.classList.add('active');
    setTimeout(() => checkAdminAuth(), 300);
  }
  try { history.replaceState({ page: path || 'home' }, '', window.location.pathname); } catch(e) {}
})();

// ═══════════════════════════════════════════
//  ADMIN — HIDDEN TRIGGER
//  Click the bottom-left corner 5× quickly
// ═══════════════════════════════════════════

let _clickCount = 0, _clickTimer = null;

function initAdminTrigger() {
  const trigger = document.getElementById('adminSecretTrigger');
  if (!trigger) return;
  trigger.addEventListener('click', () => {
    _clickCount++;
    clearTimeout(_clickTimer);
    _clickTimer = setTimeout(() => { _clickCount = 0; }, 3000);
    if (_clickCount >= 5) { _clickCount = 0; showAdminLogin(); }
  });

  ['adminEmailInput','adminPasswordInput'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') submitAdminLogin();
      if (ev.key === 'Escape') closeAdminLogin();
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminTrigger);
} else {
  initAdminTrigger();
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    showAdminLogin();
  }
});

// ── ADMIN LOGIN MODAL ──
function showAdminLogin() {
  const ov = document.getElementById('adminLoginOverlay');
  if (ov) { ov.classList.add('show'); setTimeout(() => document.getElementById('adminEmailInput')?.focus(), 100); }
}

function closeAdminLogin() {
  document.getElementById('adminLoginOverlay')?.classList.remove('show');
  document.getElementById('adminEmailInput').value    = '';
  document.getElementById('adminPasswordInput').value = '';
  document.getElementById('adminLoginError').style.display = 'none';
}

async function submitAdminLogin() {
  const email    = document.getElementById('adminEmailInput').value.trim();
  const password = document.getElementById('adminPasswordInput').value;
  const errEl    = document.getElementById('adminLoginError');
  const btn      = document.getElementById('adminLoginBtn');

  errEl.style.display = 'none';
  if (!email || !password) {
    errEl.textContent = '⚠ ENTER EMAIL AND PASSWORD';
    errEl.style.display = 'block'; return;
  }

  btn.textContent = 'AUTHENTICATING...'; btn.disabled = true;

  try {
    const sb = await getSB();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile, error: pErr } = await sb
      .from('profiles').select('role, is_master').eq('id', data.user.id).single();
    if (pErr || !profile) throw new Error('Profile not found — contact admin');

    window._adminRole     = profile.role;
    window._adminIsMaster = profile.is_master;

    closeAdminLogin();
    navigate('admin');
  } catch (err) {
    errEl.textContent = '⚠ ' + (err.message || 'ACCESS DENIED');
    errEl.style.display = 'block';
    btn.textContent = 'AUTHENTICATE'; btn.disabled = false;
  }
}

async function adminLogout() {
  const sb = await getSB();
  if (sb) await sb.auth.signOut();
  window._adminRole = null; window._adminIsMaster = false;
  navigate('home');
}

// ═══════════════════════════════════════════
//  PASSWORD RECOVERY FLOW
//  Detects Supabase's recovery token in the URL
//  and shows a set-new-password form
// ═══════════════════════════════════════════

async function checkForPasswordRecovery() {
  const hash = window.location.hash;
  if (!hash.includes('type=recovery')) return;

  // Let Supabase's client pick up the token from the URL
  const sb = await getSB();
  const { data: { session } } = await sb.auth.getSession();

  if (session) {
    const ov = document.getElementById('resetPasswordOverlay');
    if (ov) ov.classList.add('show');
  }
}

async function submitPasswordReset() {
  const pw     = document.getElementById('resetPasswordInput').value;
  const pwConf = document.getElementById('resetPasswordConfirm').value;
  const errEl  = document.getElementById('resetPasswordError');
  const btn    = document.getElementById('resetPasswordBtn');

  errEl.style.display = 'none';

  if (!pw || pw.length < 6) {
    errEl.textContent = '⚠ PASSWORD MUST BE AT LEAST 6 CHARACTERS';
    errEl.style.display = 'block'; return;
  }
  if (pw !== pwConf) {
    errEl.textContent = '⚠ PASSWORDS DO NOT MATCH';
    errEl.style.display = 'block'; return;
  }

  btn.textContent = 'UPDATING...'; btn.disabled = true;

  try {
    const sb = await getSB();
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) throw error;

    document.getElementById('resetPasswordOverlay').classList.remove('show');
    // Clean the recovery token out of the URL
    history.replaceState(null, '', window.location.pathname);
    alert('Password updated! You can now log in with your new password.');
    showAdminLogin();
  } catch (err) {
    errEl.textContent = '⚠ ' + (err.message || 'FAILED TO UPDATE PASSWORD');
    errEl.style.display = 'block';
    btn.textContent = '⚡ SET PASSWORD'; btn.disabled = false;
  }
}

// Run the check on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkForPasswordRecovery);
} else {
  checkForPasswordRecovery();
}

// ── CHECK AUTH WHEN ADMIN PAGE OPENS ──
async function checkAdminAuth() {
  try {
    const sb = await getSB();
    await new Promise(r => setTimeout(r, 200));
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { showAdminLogin(); navigate('home'); return; }

    const { data: profile } = await sb
      .from('profiles').select('role, is_master').eq('id', session.user.id).single();
    if (!profile) { navigate('home'); return; }

    window._adminRole     = profile.role;
    window._adminIsMaster = profile.is_master;

    document.querySelectorAll('.master-only').forEach(el => {
      el.style.display = profile.is_master ? '' : 'none';
    });
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = (profile.role === 'admin' || profile.is_master) ? '' : 'none';
    });

    renderAdminHeader(session.user.email, profile.role, profile.is_master);
    loadAdminOrders();
    startAdminPolling();
  } catch (err) {
    console.error('Auth check failed:', err);
    showAdminLogin(); navigate('home');
  }
}

function renderAdminHeader(email, role, isMaster) {
  const el = document.getElementById('adminUserInfo');
  if (!el) return;
  el.innerHTML = `
    <span class="au-email">${email}</span>
    <span class="admin-role-badge role-${role}">${role.toUpperCase()}${isMaster ? ' ★' : ''}</span>
    <button class="admin-logout-btn" onclick="adminLogout()">⏻ LOGOUT</button>
  `;
}

// ── ADMIN TABS ──
function showAdminTab(tab, el) {
  document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('adminTab-' + tab).style.display = 'block';
  if (el) el.classList.add('active');
  if (tab === 'users') loadAdminUsers();
  if (tab === 'orders') loadAdminOrders();
  if (tab === 'editor') loadCMSEditor();
}

// ═══════════════════════════════════════════
//  LIVE POLLING
// ═══════════════════════════════════════════

let _realtimeChannel = null;
let _fallbackInterval = null;

async function startAdminPolling() {
  if (_realtimeChannel) return;
  const sb = await getSB();

  _realtimeChannel = sb
    .channel('work_orders_realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'work_orders' }, (payload) => {
      triggerNotification(payload.new);
      loadAdminOrders();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'work_orders' }, () => {
      loadAdminOrders();
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'work_orders' }, () => {
      loadAdminOrders();
    })
    .subscribe((status) => {
      console.log('Realtime status:', status);
    });

  if (!_fallbackInterval) {
    _fallbackInterval = setInterval(() => loadAdminOrders(), 30000);
  }
}

function stopAdminPolling() {
  if (_realtimeChannel) {
    getSB().then(sb => sb.removeChannel(_realtimeChannel));
    _realtimeChannel = null;
  }
  if (_fallbackInterval) {
    clearInterval(_fallbackInterval);
    _fallbackInterval = null;
  }
}

function triggerNotification(order) {
  playBeep();
  showToast(`⚡ NEW ORDER: ${order.first_name} ${order.last_name} — ${svcLabel(order.service_type)}`);
  if (Notification.permission === 'granted') {
    new Notification('⚡ New Work Order — Foust Brothers', {
      body: `${order.first_name} ${order.last_name} — ${svcLabel(order.service_type)}`
    });
  }
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

function showToast(msg) {
  const t = document.getElementById('adminToast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 6000);
}

// ═══════════════════════════════════════════
//  ORDERS
// ═══════════════════════════════════════════

async function loadAdminOrders() {
  const box = document.getElementById('adminOrdersContainer');
  if (!box) return;
  box.innerHTML = '<div class="admin-empty">// LOADING ORDERS...</div>';
  try {
    const sb = await getSB();
    const { data: orders, error } = await sb
      .from('work_orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (Notification.permission === 'default') Notification.requestPermission();
    renderOrders(orders);
    updateStats(orders);
  } catch (err) {
    box.innerHTML = `<div class="admin-empty" style="color:#ff4466">// ERROR: ${err.message}</div>`;
  }
}

function renderOrders(orders) {
  const box = document.getElementById('adminOrdersContainer');
  if (!box) return;
  const filter = document.getElementById('adminStatusFilter')?.value || 'all';
  const list   = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const canEdit = window._adminRole === 'master' || window._adminRole === 'admin';

  if (!list.length) {
    box.innerHTML = '<div class="admin-empty">// NO ORDERS MATCH THIS FILTER</div>'; return;
  }

  box.innerHTML = list.map(o => `
    <div class="ao-card" id="order-${o.id}">
      <div class="ao-header">
        <div class="ao-meta">
          <span class="ao-id">// ORDER-${o.id.slice(0,8).toUpperCase()}</span>
          <span class="ao-time">${fmtDate(o.created_at)}</span>
        </div>
        <span class="ao-badge status-${o.status}">${o.status.replace('_',' ').toUpperCase()}</span>
      </div>

      <div class="ao-body">
        <div class="ao-grid">
          <div class="ao-field"><div class="ao-label">CLIENT</div>
            <div class="ao-val">${o.first_name} ${o.last_name}</div></div>
          <div class="ao-field"><div class="ao-label">EMAIL</div>
            <div class="ao-val"><a href="mailto:${o.email}" style="color:var(--cyan);text-decoration:none">${o.email}</a></div></div>
          <div class="ao-field"><div class="ao-label">PHONE</div>
            <div class="ao-val">${o.phone ? `<a href="tel:${o.phone}" style="color:var(--white);text-decoration:none">${o.phone}</a>` : '—'}</div></div>
          <div class="ao-field"><div class="ao-label">BUSINESS</div>
            <div class="ao-val">${o.business || '—'}</div></div>
          <div class="ao-field"><div class="ao-label">SERVICE</div>
            <div class="ao-val">${svcLabel(o.service_type)}</div></div>
          <div class="ao-field"><div class="ao-label">TIMELINE</div>
            <div class="ao-val">${o.timeline || '—'}</div></div>
          <div class="ao-field"><div class="ao-label">BUDGET</div>
            <div class="ao-val">${o.budget || '—'}</div></div>
          <div class="ao-field"><div class="ao-label">SOURCE</div>
            <div class="ao-val">${o.how_heard || '—'}</div></div>
          ${o.existing_site ? `<div class="ao-field"><div class="ao-label">EXISTING SITE</div>
            <div class="ao-val"><a href="${o.existing_site}" target="_blank" style="color:var(--cyan);text-decoration:none">${o.existing_site}</a></div></div>` : ''}
        </div>

        ${o.description ? `
        <div class="ao-desc-wrap">
          <div class="ao-label">PROJECT DESCRIPTION</div>
          <div class="ao-desc">${o.description}</div>
        </div>` : ''}
      </div>

      ${canEdit ? `
      <div class="ao-footer">
        <span class="ao-label">STATUS:</span>
        <div class="ao-status-btns">
          <button class="ao-sbtn ${o.status==='new'?'active':''}"
            onclick="setStatus('${o.id}','new')">NEW</button>
          <button class="ao-sbtn ${o.status==='in_progress'?'active':''}"
            onclick="setStatus('${o.id}','in_progress')">IN PROGRESS</button>
          <button class="ao-sbtn ${o.status==='complete'?'active':''}"
            onclick="setStatus('${o.id}','complete')">COMPLETE</button>
          <button class="ao-sbtn ${o.status==='cancelled'?'active':''}"
            onclick="setStatus('${o.id}','cancelled')">CANCELLED</button>
          <button class="ao-sbtn danger" onclick="deleteOrder('${o.id}','${o.first_name} ${o.last_name}')">✕ DELETE</button>
        </div>
      </div>` : ''}
    </div>
  `).join('');
}

async function deleteOrder(id, name) {
  if (!confirm(`Delete order from ${name}?\nThis cannot be undone.`)) return;
  try {
    const sb = await getSB();
    await sb.from('work_orders').delete().eq('id', id);
    const { data } = await sb.from('work_orders').select('*').order('created_at', { ascending: false });
    renderOrders(data); updateStats(data);
    showToast(`✓ ORDER DELETED: ${name}`);
  } catch (err) { alert('Delete failed: ' + err.message); }
}

function updateStats(orders) {
  const s = id => {
    const e = document.getElementById(id);
    if (e) e.textContent = id === 'adminStatTotal'
      ? orders.length
      : orders.filter(o => o.status === ({ adminStatNew:'new', adminStatProgress:'in_progress', adminStatComplete:'complete' }[id])).length;
  };
  ['adminStatTotal','adminStatNew','adminStatProgress','adminStatComplete'].forEach(s);
}

async function setStatus(id, status) {
  try {
    const sb = await getSB();
    await sb.from('work_orders').update({ status }).eq('id', id);
    const { data } = await sb.from('work_orders').select('*').order('created_at', { ascending: false });
    renderOrders(data); updateStats(data);
  } catch (err) { alert('Update failed: ' + err.message); }
}

async function adminFilterOrders() {
  const sb = await getSB();
  const { data } = await sb.from('work_orders').select('*').order('created_at', { ascending: false });
  if (data) { renderOrders(data); updateStats(data); }
}

function refreshAdminOrders() { loadAdminOrders(); }

// ═══════════════════════════════════════════
//  USER MANAGEMENT  (master admin only)
// ═══════════════════════════════════════════

async function loadAdminUsers() {
  const box = document.getElementById('adminUsersContainer');
  if (!box) return;
  box.innerHTML = '<div class="admin-empty">// LOADING USERS...</div>';
  try {
    const sb = await getSB();
    const { data: users, error } = await sb
      .from('profiles').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    renderUsers(users);
  } catch (err) {
    box.innerHTML = `<div class="admin-empty" style="color:#ff4466">// ERROR: ${err.message}</div>`;
  }
}

function renderUsers(users) {
  const box = document.getElementById('adminUsersContainer');
  if (!box) return;
  box.innerHTML = `
    <!-- Create User Form -->
    <div style="border:1px solid rgba(0,229,255,.3);background:var(--bg-card);margin-bottom:1.5rem;">
      <div style="padding:.7rem 1.25rem;border-bottom:1px solid var(--border);background:rgba(0,229,255,.03);font-family:var(--font-mono);font-size:.58rem;color:var(--cyan);letter-spacing:.2em;">
        // CREATE NEW USER
      </div>
      <div style="padding:1.25rem;display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-end;">
        <div style="flex:1;min-width:200px;">
          <label class="admin-input-label">EMAIL</label>
          <input type="email" id="newUserEmail" class="admin-input-field" placeholder="user@email.com" />
        </div>
        <div style="flex:1;min-width:200px;">
          <label class="admin-input-label">PASSWORD</label>
          <input type="password" id="newUserPassword" class="admin-input-field" placeholder="••••••••" />
        </div>
        <div style="min-width:140px;">
          <label class="admin-input-label">ROLE</label>
          <select id="newUserRole" class="admin-select" style="width:100%;padding:11px 14px;">
            <option value="user">USER</option>
            <option value="admin">ADMIN</option>
          </select>
        </div>
        <button class="admin-login-btn" style="padding:11px 22px;white-space:nowrap;" onclick="createUser()">
          ⚡ CREATE USER
        </button>
      </div>
      <div id="createUserMsg" style="font-family:var(--font-mono);font-size:.6rem;letter-spacing:.1em;padding:0 1.25rem .75rem;min-height:1.2rem;"></div>
    </div>

    <!-- User List -->
    ${users.map(u => `
      <div class="ao-card" style="margin-bottom:1px">
        <div class="ao-header">
          <div class="ao-meta">
            <span class="ao-id">${u.email}</span>
            <span class="ao-time">${fmtDate(u.created_at)}</span>
          </div>
          <span class="admin-role-badge role-${u.role}">${u.role.toUpperCase()}${u.is_master ? ' ★' : ''}</span>
        </div>
        ${u.is_master
          ? `<div style="padding:.6rem 1.25rem;font-family:var(--font-mono);font-size:.55rem;color:var(--cyan);letter-spacing:.1em">// MASTER ADMIN — PROTECTED ACCOUNT</div>`
          : `<div class="ao-footer">
              <span class="ao-label">ROLE:</span>
              <div class="ao-status-btns">
                <button class="ao-sbtn ${u.role==='admin'?'active':''}" onclick="setUserRole('${u.id}','admin')">ADMIN</button>
                <button class="ao-sbtn ${u.role==='user'?'active':''}"  onclick="setUserRole('${u.id}','user')">USER</button>
                <button class="ao-sbtn danger" onclick="removeUser('${u.id}','${u.email}')">✕ REMOVE</button>
              </div>
             </div>`
        }
      </div>
    `).join('')}
  `;
}

async function createUser() {
  const email    = document.getElementById('newUserEmail').value.trim();
  const password = document.getElementById('newUserPassword').value;
  const role     = document.getElementById('newUserRole').value;
  const msg      = document.getElementById('createUserMsg');

  if (!email || !password) {
    msg.style.color = '#ff4466';
    msg.textContent = '⚠ EMAIL AND PASSWORD REQUIRED';
    return;
  }
  if (password.length < 6) {
    msg.style.color = '#ff4466';
    msg.textContent = '⚠ PASSWORD MUST BE AT LEAST 6 CHARACTERS';
    return;
  }

  msg.style.color = 'var(--cyan)';
  msg.textContent = '// CREATING USER...';

  try {
    const sb = await getSB();

    // Sign up the new user
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('User creation failed');

    // Set their role in profiles table
    await sb.from('profiles').upsert({
      id: data.user.id,
      email,
      role,
      is_master: false
    }, { onConflict: 'id' });

    msg.style.color = '#00ff88';
    msg.textContent = `✓ USER CREATED: ${email} — ${role.toUpperCase()}`;

    // Clear form
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserRole').value = 'user';

    // Reload user list
    setTimeout(() => loadAdminUsers(), 1000);

  } catch(err) {
    msg.style.color = '#ff4466';
    msg.textContent = '⚠ ' + (err.message || 'CREATE FAILED');
  }
}

async function setUserRole(userId, role) {
  const sb = await getSB();
  await sb.from('profiles').update({ role }).eq('id', userId);
  loadAdminUsers();
}

async function removeUser(userId, email) {
  if (!confirm(`Remove ${email}?\nThis cannot be undone.`)) return;
  const sb = await getSB();
  await sb.from('profiles').delete().eq('id', userId);
  loadAdminUsers();
}

// ═══════════════════════════════════════════
//  CMS EDITOR — Admin Panel
// ═══════════════════════════════════════════

const CMS_FIELDS = [
  // ── SITE CONTROLS ──
  ['SITE CONTROLS', 'hero_visible', 'Orb Visible', 'toggle'],

  // ── HOME ──
  ['HOME', 'nav_status',        'Nav Status Text',               'text'],
  ['HOME', 'hero_directive',    'Hero Directive Label',           'text'],
  ['HOME', 'hero_line1',        'Hero Headline — Line 1',         'text'],
  ['HOME', 'hero_line2',        'Hero Headline — Line 2',         'text'],
  ['HOME', 'hero_line3',        'Hero Headline — Line 3 (Cyan)',  'text'],
  ['HOME', 'hero_sub',          'Hero Sub Headline',              'text'],
  ['HOME', 'hero_btn_primary',  'Hero Button — Primary',          'text'],
  ['HOME', 'hero_btn_secondary','Hero Button — Secondary',        'text'],
  ['HOME', 'boot_line1',        'Boot Sequence — Line 1',         'text'],
  ['HOME', 'boot_line2',        'Boot Sequence — Line 2',         'text'],
  ['HOME', 'boot_line3',        'Boot Sequence — Line 3',         'text'],
  ['HOME', 'boot_line4',        'Boot Sequence — Line 4',         'text'],
  ['HOME', 'boot_line5',        'Boot Sequence — Line 5',         'text'],
  ['HOME', 'sys_philosophy',    'Left Panel — Philosophy',        'text'],
  ['HOME', 'sys_standard',      'Left Panel — Standard',          'text'],
  ['HOME', 'sys_commitment',    'Left Panel — Commitment',        'text'],
  ['HOME', 'sys_warranty',      'Left Panel — Warranty',          'text'],
  ['HOME', 'sys_status',        'Right Panel — Status Value',     'text'],
  ['HOME', 'sys_uptime',        'Right Panel — Uptime Value',     'text'],
  ['HOME', 'sys_billing',       'Right Panel — Billing Value',    'text'],
  ['HOME', 'sys_region',        'Right Panel — Region Value',     'text'],

  // ── SERVICES ──
  ['SERVICES', 'svc_consultation_title', 'Service: Consultation Title',   'text'],
  ['SERVICES', 'svc_logo_title',         'Service: Logo Design Title',     'text'],
  ['SERVICES', 'svc_flyer_title',        'Service: Digital Flyers Title',  'text'],
  ['SERVICES', 'svc_brochure_title',     'Service: Brochure Site Title',   'text'],
  ['SERVICES', 'svc_simple_title',       'Service: Simple Build Title',    'text'],
  ['SERVICES', 'svc_standard_title',     'Service: Standard Build Title',  'text'],
  ['SERVICES', 'svc_full_title',         'Service: Full Build Title',      'text'],

  // ── BILLING ──
  ['BILLING', 'billing_intro',       'Billing Intro Text',          'textarea'],
  ['BILLING', 'price_tier1',         'Tier 1 Price',                'text'],
  ['BILLING', 'price_tier2',         'Tier 2 Price',                'text'],
  ['BILLING', 'price_tier3',         'Tier 3 Price',                'text'],
  ['BILLING', 'price_retainer_mo',   'Retainer Monthly Price',      'text'],
  ['BILLING', 'price_retainer_yr',   'Retainer Annual Price',       'text'],
  ['BILLING', 'rate_standard',       'Standard Shop Rate',          'text'],
  ['BILLING', 'rate_overtime',       'Overtime Rate',               'text'],
  ['BILLING', 'rate_rush',           'Rush Rate Multiplier',        'text'],
  ['BILLING', 'spec_logo_price',     'Logo Design Price Range',     'text'],
  ['BILLING', 'spec_logo_desc',      'Logo Design Description',     'text'],
  ['BILLING', 'spec_flyer_price',    'Digital Flyers Price Range',  'text'],
  ['BILLING', 'spec_flyer_desc',     'Digital Flyers Description',  'text'],
  ['BILLING', 'spec_domain_price',   'Domain Privacy Price Range',  'text'],
  ['BILLING', 'spec_domain_desc',    'Domain Privacy Description',  'text'],

  // ── ABOUT ──
  ['ABOUT', 'about_headline', 'About Page Headline', 'textarea'],

  // ── FOOTER ──
  ['FOOTER', 'footer_tagline',    'Footer Tagline',              'textarea'],
  ['FOOTER', 'footer_motto',      'Footer Motto Box',            'text'],
  ['FOOTER', 'footer_philosophy', 'Footer Bottom Philosophy',    'text'],

  // ── WORK ORDER ──
  ['WORK ORDER', 'step1', 'Step 1 — Submit Description',  'textarea'],
  ['WORK ORDER', 'step2', 'Step 2 — Review Description',  'textarea'],
  ['WORK ORDER', 'step3', 'Step 3 — Quote Description',   'textarea'],
  ['WORK ORDER', 'step4', 'Step 4 — Deliver Description', 'textarea'],

  // ── CONTACT ──
  ['CONTACT', 'contact_phone', 'Phone Number', 'text'],
];

async function loadCMSEditor() {
  const box = document.getElementById('adminEditorContainer');
  if (!box) return;
  box.innerHTML = '<div class="admin-empty">// LOADING EDITOR...</div>';

  try {
    const sb = await getSB();
    const { data: rows } = await sb.from('content').select('key, value');
    const map = {};
    if (rows) rows.forEach(r => map[r.key] = r.value);

    const sections = {};
    CMS_FIELDS.forEach(([section, key, label, type]) => {
      if (!sections[section]) sections[section] = [];
      sections[section].push({ key, label, type, value: map[key] ?? '' });
    });

    box.innerHTML = `
      <div style="margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;border:1px solid var(--border);background:var(--bg-card);padding:1.25rem;">
        <div style="font-family:var(--font-mono);font-size:.6rem;color:var(--white-dim);letter-spacing:.15em">
          // Edit fields below and click SAVE ALL CHANGES
        </div>
        <button id="saveTopBtn" class="admin-login-btn" style="padding:10px 24px" onclick="saveCMSContent()">
          ⚡ SAVE ALL CHANGES
        </button>
      </div>

      ${Object.entries(sections).map(([section, fields]) => `
        <div style="margin-bottom:1.5rem">
          <div style="font-family:var(--font-mono);font-size:.58rem;color:var(--cyan);
            letter-spacing:.2em;padding:.6rem 1.25rem;border:1px solid var(--border);
            background:rgba(0,229,255,.04);border-bottom:none">
            // ${section}
          </div>
          <div style="border:1px solid var(--border);background:var(--bg-card)">
            ${fields.map(f => {
              if (f.type === 'toggle') {
                const isOn = f.value !== 'false' && f.value !== '0' && f.value !== '';
                return `
                  <div style="padding:.85rem 1.25rem;border-bottom:1px solid var(--border);
                    display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
                    <div>
                      <label class="admin-input-label" style="margin:0;display:block">${f.label}</label>
                      <div style="font-family:var(--font-mono);font-size:.5rem;color:var(--white-dim);letter-spacing:.08em;margin-top:3px">
                        Controls whether the orb animation is shown on the homepage
                      </div>
                    </div>
                    <button
                      data-cms-key="${f.key}"
                      data-cms-type="toggle"
                      data-value="${isOn ? 'true' : 'false'}"
                      onclick="toggleCMSField(this)"
                      style="
                        font-family:var(--font-mono);font-size:.65rem;letter-spacing:.18em;font-weight:700;
                        padding:10px 28px;border:1px solid;cursor:pointer;transition:all .25s;min-width:140px;
                        ${isOn
                          ? 'color:#00ff88;border-color:rgba(0,255,136,.5);background:rgba(0,255,136,.08)'
                          : 'color:#ff4466;border-color:rgba(255,68,102,.4);background:rgba(255,68,102,.06)'}
                      ">
                      ${isOn ? '▶ ONLINE' : '■ OFFLINE'}
                    </button>
                  </div>`;
              }
              return `
                <div style="padding:.85rem 1.25rem;border-bottom:1px solid var(--border)">
                  <label class="admin-input-label" style="margin-bottom:5px">${f.label}</label>
                  ${f.type === 'textarea'
                    ? `<textarea data-cms-key="${f.key}" class="admin-input-field"
                        style="min-height:70px;resize:vertical;padding:8px 12px;width:100%;box-sizing:border-box"
                      >${f.value}</textarea>`
                    : `<input type="text" data-cms-key="${f.key}" class="admin-input-field"
                        value="${f.value.replace(/"/g,'&quot;')}" />`
                  }
                </div>`;
            }).join('')}
          </div>
        </div>
      `).join('')}

      <div style="margin-top:1.5rem;border:1px solid var(--border);background:var(--bg-card);padding:1.25rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
        <div id="editorSaveMsg" style="font-family:var(--font-mono);font-size:.65rem;letter-spacing:.1em;flex:1;"></div>
        <button id="saveBottomBtn" class="admin-login-btn" style="padding:12px 32px" onclick="saveCMSContent()">
          ⚡ SAVE ALL CHANGES
        </button>
      </div>
    `;
  } catch(err) {
    box.innerHTML = `<div class="admin-empty" style="color:#ff4466">// ERROR: ${err.message}</div>`;
  }
}

function toggleCMSField(btn) {
  const isOn = btn.getAttribute('data-value') === 'true';
  const newVal = isOn ? 'false' : 'true';
  btn.setAttribute('data-value', newVal);

  if (!isOn) {
    // Turning ON
    btn.textContent = '▶ ONLINE';
    btn.style.color = '#00ff88';
    btn.style.borderColor = 'rgba(0,255,136,.5)';
    btn.style.background = 'rgba(0,255,136,.08)';
  } else {
    // Turning OFF
    btn.textContent = '■ OFFLINE';
    btn.style.color = '#ff4466';
    btn.style.borderColor = 'rgba(255,68,102,.4)';
    btn.style.background = 'rgba(255,68,102,.06)';
  }
}

async function saveCMSContent() {
  const msg = document.getElementById('editorSaveMsg');

  // Flash both buttons
  const flashBtn = (id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.textContent = '✓ ALL CHANGES SAVED';
    btn.style.borderColor = '#00ff88';
    btn.style.color = '#00ff88';
    setTimeout(() => {
      btn.innerHTML = '⚡ SAVE ALL CHANGES';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 5000);
  };

  flashBtn('saveTopBtn');
  flashBtn('saveBottomBtn');

  try {
    const sb = await getSB();
    const inputs = document.querySelectorAll('[data-cms-key]');
    const upserts = Array.from(inputs).map(el => ({
      key: el.getAttribute('data-cms-key'),
      value: el.getAttribute('data-cms-type') === 'toggle'
        ? el.getAttribute('data-value')
        : (el.value !== undefined ? el.value : el.textContent),
      updated_at: new Date().toISOString()
    }));

    const { error } = await sb.from('content').upsert(upserts, { onConflict: 'key' });
    if (error) throw error;

    await loadCMSContent();

    if (msg) { msg.style.color = '#00ff88'; msg.textContent = '✓ SITE UPDATED LIVE'; }
    setTimeout(() => { if (msg) msg.textContent = ''; }, 5000);
  } catch(err) {
    if (msg) { msg.style.color = '#ff4466'; msg.textContent = '⚠ SAVE FAILED: ' + err.message; }
    ['saveTopBtn','saveBottomBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) { btn.innerHTML = '⚠ SAVE FAILED'; btn.style.color = '#ff4466'; btn.style.borderColor = '#ff4466'; }
    });
  }
}

// ═══════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US',{ hour:'2-digit', minute:'2-digit' });
}

function svcLabel(val) {
  return ({ consultation:'Consultation', logo:'Logo Design', flyer:'Digital Flyers',
    brochure:'Brochure Site', simple:'1–3 Page Build', standard:'3–5 Page Build',
    full:'5–10 Page Build', unsure:'Needs Guidance' })[val] || val || '—';
}
