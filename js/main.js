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
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Config unavailable');
  _cfg = await res.json();
  return _cfg;
}

async function getSB() {
  if (_sb) return _sb;
  const cfg = await getCfg();
  if (!window.supabase) {
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
  }
  _sb = window.supabase.createClient(cfg.url, cfg.key);
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

  // Web3Forms (email)
  const w3 = new FormData(e.target);
  w3.append('access_key', 'e9d0aa34-4229-4f32-bec4-02b98db6c0e9');
  w3.append('subject', 'New Work Order — Foust Brothers LLC');

  // Supabase payload
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
  try { history.replaceState({ page: path || 'home' }, '', window.location.pathname); } catch(e) {}
})();

// ═══════════════════════════════════════════
//  ADMIN — HIDDEN TRIGGER
//  Click the bottom-left corner 5× quickly
// ═══════════════════════════════════════════

let _clickCount = 0, _clickTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('adminSecretTrigger');
  if (!trigger) return;
  trigger.addEventListener('click', () => {
    _clickCount++;
    clearTimeout(_clickTimer);
    _clickTimer = setTimeout(() => { _clickCount = 0; }, 3000);
    if (_clickCount >= 5) { _clickCount = 0; showAdminLogin(); }
  });

  // Keyboard listeners for login modal
  ['adminEmailInput','adminPasswordInput'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') submitAdminLogin();
      if (ev.key === 'Escape') closeAdminLogin();
    });
  });
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

// ── CHECK AUTH WHEN ADMIN PAGE OPENS ──
async function checkAdminAuth() {
  try {
    const sb = await getSB();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { showAdminLogin(); navigate('home'); return; }

    const { data: profile } = await sb
      .from('profiles').select('role, is_master').eq('id', session.user.id).single();
    if (!profile) { navigate('home'); return; }

    window._adminRole     = profile.role;
    window._adminIsMaster = profile.is_master;

    // Show/hide master-only UI
    document.querySelectorAll('.master-only').forEach(el => {
      el.style.display = profile.is_master ? '' : 'none';
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
}

// ═══════════════════════════════════════════
//  LIVE POLLING
// ═══════════════════════════════════════════

let _pollInterval = null;
let _knownIds     = new Set();
let _firstLoad    = true;

function startAdminPolling() {
  if (_pollInterval) return;
  _pollInterval = setInterval(async () => {
    if (_firstLoad) return;
    try {
      const sb = await getSB();
      const { data: orders } = await sb.from('work_orders').select('*').order('created_at', { ascending: false });
      if (!orders) return;
      const newOnes = orders.filter(o => !_knownIds.has(o.id));
      if (newOnes.length && _knownIds.size) {
        newOnes.forEach(triggerNotification);
        renderOrders(orders);
        updateStats(orders);
      }
      _knownIds = new Set(orders.map(o => o.id));
    } catch {}
  }, 15000);
}

function stopAdminPolling() {
  clearInterval(_pollInterval); _pollInterval = null; _firstLoad = true;
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
    _knownIds = new Set(orders.map(o => o.id));
    _firstLoad = false;
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
        </div>
      </div>` : ''}
    </div>
  `).join('');
}

function updateStats(orders) {
  const s = id => { const e = document.getElementById(id); if(e) e.textContent = id === 'adminStatTotal' ? orders.length
    : orders.filter(o => o.status === ({ adminStatNew:'new', adminStatProgress:'in_progress', adminStatComplete:'complete' }[id])).length; };
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
  box.innerHTML = users.map(u => `
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
  `).join('');
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

async function sendInvite() {
  const emailEl = document.getElementById('inviteEmail');
  const roleEl  = document.getElementById('inviteRole');
  const msgEl   = document.getElementById('inviteMsg');
  const email   = emailEl.value.trim();
  if (!email) { msgEl.style.color='#ff4466'; msgEl.textContent='⚠ Enter an email address'; return; }

  msgEl.style.color = 'var(--cyan)'; msgEl.textContent = '// SENDING INVITE...';

  try {
    const [sb, cfg] = await Promise.all([getSB(), getCfg()]);
    const { data: { session } } = await sb.auth.getSession();

    const res = await fetch(`${cfg.url}/auth/v1/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': cfg.key,
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ email })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Invite failed');
    }

    // Pre-set role in profiles (trigger will create the row; we update after a moment)
    const role = roleEl.value;
    setTimeout(async () => {
      const { data: prof } = await sb.from('profiles').select('id').eq('email', email).single();
      if (prof) await sb.from('profiles').update({ role }).eq('id', prof.id);
    }, 2000);

    msgEl.style.color = '#00ff88';
    msgEl.textContent = `✓ Invite sent to ${email} — they will receive an email to set their password.`;
    emailEl.value = '';
    setTimeout(() => loadAdminUsers(), 3000);
  } catch (err) {
    msgEl.style.color = '#ff4466'; msgEl.textContent = '⚠ ' + err.message;
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
