/* js/main.js — Navigation, clock, ticker, forms, routing + Secure Admin Panel */
/* NO KEYS OR PASSWORDS IN THIS FILE — all credentials served from /api/config */

// ── SUPABASE CLIENT (loaded securely at runtime) ──
let _supabase = null;

async function getSupabase() {
  if (_supabase) return _supabase;
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Config fetch failed');
    const { url, key } = await res.json();
    // Load Supabase SDK dynamically
    if (!window.supabase) {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
    }
    _supabase = window.supabase.createClient(url, key);
    return _supabase;
  } catch (err) {
    console.error('Supabase init failed:', err);
    return null;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── NAVIGATION ──
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
  if (e.state && e.state.page) navigate(e.state.page);
});

// ── MOBILE NAV TOGGLE ──
document.querySelector('.nav-toggle').addEventListener('click', function () {
  document.querySelector('.nav-links').classList.toggle('open');
});

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

  // Web3Forms email notification
  const web3Data = new FormData(e.target);
  web3Data.append('access_key', 'e9d0aa34-4229-4f32-bec4-02b98db6c0e9');
  web3Data.append('subject', 'New Work Order — Foust Brothers LLC');

  // Supabase insert payload
  const orderData = {
    first_name: formData.get('firstName'),
    last_name: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone') || '',
    business: formData.get('business') || '',
    service_type: formData.get('serviceType'),
    timeline: formData.get('timeline') || '',
    budget: formData.get('budget') || '',
    existing_site: formData.get('existingSite') || '',
    description: formData.get('description'),
    how_heard: formData.get('howHeard') || '',
    status: 'new'
  };

  try {
    const sb = await getSupabase();
    const promises = [
      fetch('https://api.web3forms.com/submit', {
        method: 'POST', body: web3Data, headers: { Accept: 'application/json' }
      })
    ];
    if (sb) {
      promises.push(sb.from('work_orders').insert(orderData));
    }
    await Promise.all(promises);

    document.getElementById('successMsg').classList.add('show');
    btn.innerHTML = '✓ REQUEST TRANSMITTED';
    btn.classList.add('success');
    e.target.reset();
  } catch (err) {
    console.error('Submit error:', err);
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
document.querySelectorAll('.footerYear').forEach(el => el.textContent = new Date().getFullYear());

// ── INITIAL PAGE LOAD ──
(function () {
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
  const validPages = ['about', 'billing', 'work-order', 'privacy', 'terms'];
  if (validPages.includes(path)) {
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
//  Click bottom-left corner 5 times quickly
// ═══════════════════════════════════════════

let adminClickCount = 0;
let adminClickTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('adminSecretTrigger');
  if (trigger) {
    trigger.addEventListener('click', () => {
      adminClickCount++;
      clearTimeout(adminClickTimer);
      adminClickTimer = setTimeout(() => { adminClickCount = 0; }, 3000);
      if (adminClickCount >= 5) {
        adminClickCount = 0;
        showAdminLogin();
      }
    });
  }
});

// ── ADMIN LOGIN ──
function showAdminLogin() {
  const overlay = document.getElementById('adminLoginOverlay');
  if (overlay) {
    overlay.classList.add('show');
    setTimeout(() => {
      const inp = document.getElementById('adminEmailInput');
      if (inp) inp.focus();
    }, 100);
  }
}

function closeAdminLogin() {
  const overlay = document.getElementById('adminLoginOverlay');
  if (overlay) overlay.classList.remove('show');
  const email = document.getElementById('adminEmailInput');
  const pass = document.getElementById('adminPasswordInput');
  const err = document.getElementById('adminLoginError');
  if (email) email.value = '';
  if (pass) pass.value = '';
  if (err) err.style.display = 'none';
}

async function submitAdminLogin() {
  const email = document.getElementById('adminEmailInput').value.trim();
  const password = document.getElementById('adminPasswordInput').value;
  const err = document.getElementById('adminLoginError');
  const btn = document.getElementById('adminLoginBtn');

  if (!email || !password) {
    err.textContent = '⚠ ENTER EMAIL AND PASSWORD';
    err.style.display = 'block';
    return;
  }

  btn.textContent = 'AUTHENTICATING...';
  btn.disabled = true;
  err.style.display = 'none';

  try {
    const sb = await getSupabase();
    if (!sb) throw new Error('Connection failed');

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Check role in profiles table
    const { data: profile, error: profileErr } = await sb
      .from('profiles')
      .select('role, is_master')
      .eq('id', data.user.id)
      .single();

    if (profileErr || !profile) throw new Error('Profile not found');

    const allowed = ['master', 'admin', 'user'];
    if (!allowed.includes(profile.role)) throw new Error('Access denied');

    // Store role for UI
    window._adminRole = profile.role;
    window._adminIsMaster = profile.is_master;

    closeAdminLogin();
    navigate('admin');
  } catch (e) {
    err.textContent = '⚠ ' + (e.message || 'ACCESS DENIED');
    err.style.display = 'block';
    btn.textContent = 'AUTHENTICATE';
    btn.disabled = false;
  }
}

async function adminLogout() {
  const sb = await getSupabase();
  if (sb) await sb.auth.signOut();
  window._adminRole = null;
  window._adminIsMaster = false;
  navigate('home');
}

// ── CHECK AUTH ON ADMIN PAGE LOAD ──
async function checkAdminAuth() {
  const sb = await getSupabase();
  if (!sb) { navigate('home'); return; }

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    showAdminLogin();
    navigate('home');
    return;
  }

  // Re-fetch role
  const { data: profile } = await sb
    .from('profiles')
    .select('role, is_master')
    .eq('id', session.user.id)
    .single();

  if (!profile) { navigate('home'); return; }

  window._adminRole = profile.role;
  window._adminIsMaster = profile.is_master;

  renderAdminHeader(session.user.email, profile.role);
  loadAdminOrders();
  startAdminPolling();

  // Show/hide master-only controls
  document.querySelectorAll('.master-only').forEach(el => {
    el.style.display = profile.is_master ? '' : 'none';
  });
}

function renderAdminHeader(email, role) {
  const el = document.getElementById('adminUserInfo');
  if (el) el.innerHTML = `
    <span style="font-family:var(--font-mono);font-size:.6rem;color:var(--white-dim);letter-spacing:.1em">${email}</span>
    <span class="admin-role-badge role-${role}">${role.toUpperCase()}</span>
    <button onclick="adminLogout()" style="padding:5px 12px;background:transparent;border:1px solid #ff4466;color:#ff4466;font-family:var(--font-mono);font-size:.55rem;letter-spacing:.1em;cursor:pointer;">LOGOUT</button>
  `;
}

// ── ADMIN POLLING ──
let adminPollInterval = null;
let lastOrderIds = new Set();
let firstLoad = true;

function startAdminPolling() {
  if (adminPollInterval) return;
  adminPollInterval = setInterval(async () => {
    if (firstLoad) return;
    await checkForNewOrders();
  }, 15000);
}

function stopAdminPolling() {
  if (adminPollInterval) {
    clearInterval(adminPollInterval);
    adminPollInterval = null;
  }
  firstLoad = true;
}

async function checkForNewOrders() {
  try {
    const sb = await getSupabase();
    if (!sb) return;
    const { data: orders } = await sb.from('work_orders').select('*').order('created_at', { ascending: false });
    if (!orders) return;

    const currentIds = new Set(orders.map(o => o.id));
    const newOrders = orders.filter(o => !lastOrderIds.has(o.id));

    if (newOrders.length > 0 && lastOrderIds.size > 0) {
      newOrders.forEach(order => triggerAdminNotification(order));
      renderAdminOrders(orders);
    }
    lastOrderIds = currentIds;
  } catch (err) {
    console.error('Poll error:', err);
  }
}

function triggerAdminNotification(order) {
  playNotificationSound();
  showAdminToast(`⚡ NEW ORDER: ${order.first_name} ${order.last_name} — ${formatService(order.service_type)}`);
  if (Notification.permission === 'granted') {
    new Notification('⚡ New Work Order — Foust Brothers', {
      body: `${order.first_name} ${order.last_name} submitted a ${formatService(order.service_type)} request.`
    });
  }
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}

function showAdminToast(message) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 6000);
}

// ── LOAD & RENDER ORDERS ──
async function loadAdminOrders() {
  const container = document.getElementById('adminOrdersContainer');
  if (!container) return;
  container.innerHTML = '<div class="admin-loading">// LOADING ORDERS...</div>';

  try {
    const sb = await getSupabase();
    if (!sb) throw new Error('No connection');

    const { data: orders, error } = await sb
      .from('work_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    lastOrderIds = new Set(orders.map(o => o.id));
    firstLoad = false;

    if (Notification.permission === 'default') Notification.requestPermission();

    renderAdminOrders(orders);
    updateAdminStats(orders);
  } catch (err) {
    container.innerHTML = `<div class="admin-loading" style="color:#ff4466">// ERROR: ${err.message}</div>`;
  }
}

function renderAdminOrders(orders) {
  const container = document.getElementById('adminOrdersContainer');
  if (!container) return;

  const filter = document.getElementById('adminStatusFilter')?.value || 'all';
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="admin-loading">// NO ORDERS FOUND</div>';
    return;
  }

  const canEdit = window._adminRole === 'master' || window._adminRole === 'admin';

  container.innerHTML = filtered.map(order => `
    <div class="admin-order-card" data-id="${order.id}">
      <div class="admin-order-header">
        <div class="admin-order-meta">
          <span class="admin-order-id">// ORDER-${order.id.slice(0,8).toUpperCase()}</span>
          <span class="admin-order-time">${formatDate(order.created_at)}</span>
        </div>
        <span class="admin-status-badge status-${order.status}">${order.status.replace('_',' ').toUpperCase()}</span>
      </div>
      <div class="admin-order-body">
        <div class="admin-order-grid">
          <div class="admin-field"><div class="admin-field-label">CLIENT</div><div class="admin-field-value">${order.first_name} ${order.last_name}</div></div>
          <div class="admin-field"><div class="admin-field-label">EMAIL</div><div class="admin-field-value"><a href="mailto:${order.email}" style="color:var(--cyan)">${order.email}</a></div></div>
          <div class="admin-field"><div class="admin-field-label">PHONE</div><div class="admin-field-value">${order.phone || '—'}</div></div>
          <div class="admin-field"><div class="admin-field-label">BUSINESS</div><div class="admin-field-value">${order.business || '—'}</div></div>
          <div class="admin-field"><div class="admin-field-label">SERVICE</div><div class="admin-field-value">${formatService(order.service_type)}</div></div>
          <div class="admin-field"><div class="admin-field-label">TIMELINE</div><div class="admin-field-value">${order.timeline || '—'}</div></div>
          <div class="admin-field"><div class="admin-field-label">BUDGET</div><div class="admin-field-value">${order.budget || '—'}</div></div>
          <div class="admin-field"><div class="admin-field-label">SOURCE</div><div class="admin-field-value">${order.how_heard || '—'}</div></div>
        </div>
        ${order.description ? `<div class="admin-field" style="margin-top:1rem"><div class="admin-field-label">PROJECT DESCRIPTION</div><div class="admin-field-value admin-description">${order.description}</div></div>` : ''}
        ${order.existing_site ? `<div class="admin-field" style="margin-top:.5rem"><div class="admin-field-label">EXISTING SITE</div><div class="admin-field-value">${order.existing_site}</div></div>` : ''}
      </div>
      ${canEdit ? `
      <div class="admin-order-footer">
        <div class="admin-field-label">UPDATE STATUS:</div>
        <div class="admin-status-buttons">
          <button class="admin-status-btn ${order.status==='new'?'active':''}" onclick="setOrderStatus('${order.id}','new')">NEW</button>
          <button class="admin-status-btn ${order.status==='in_progress'?'active':''}" onclick="setOrderStatus('${order.id}','in_progress')">IN PROGRESS</button>
          <button class="admin-status-btn ${order.status==='complete'?'active':''}" onclick="setOrderStatus('${order.id}','complete')">COMPLETE</button>
          <button class="admin-status-btn ${order.status==='cancelled'?'active':''}" onclick="setOrderStatus('${order.id}','cancelled')">CANCELLED</button>
        </div>
      </div>` : ''}
    </div>
  `).join('');
}

function updateAdminStats(orders) {
  const set = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
  set('adminStatTotal', orders.length);
  set('adminStatNew', orders.filter(o => o.status === 'new').length);
  set('adminStatProgress', orders.filter(o => o.status === 'in_progress').length);
  set('adminStatComplete', orders.filter(o => o.status === 'complete').length);
}

async function setOrderStatus(id, status) {
  try {
    const sb = await getSupabase();
    if (!sb) return;
    await sb.from('work_orders').update({ status }).eq('id', id);
    const { data: orders } = await sb.from('work_orders').select('*').order('created_at', { ascending: false });
    renderAdminOrders(orders);
    updateAdminStats(orders);
  } catch (err) {
    alert('Failed to update: ' + err.message);
  }
}

function adminFilterOrders() {
  getSupabase().then(sb => {
    if (!sb) return;
    sb.from('work_orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) { renderAdminOrders(data); updateAdminStats(data); }
    });
  });
}

function refreshAdminOrders() { loadAdminOrders(); }

// ── USER MANAGEMENT (master only) ──
async function loadAdminUsers() {
  const container = document.getElementById('adminUsersContainer');
  if (!container) return;
  container.innerHTML = '<div class="admin-loading">// LOADING USERS...</div>';

  try {
    const sb = await getSupabase();
    const { data: users, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    container.innerHTML = users.map(u => `
      <div class="admin-order-card" style="margin-bottom:1px">
        <div class="admin-order-header">
          <div class="admin-order-meta">
            <span class="admin-order-id">${u.email}</span>
            <span class="admin-order-time">${formatDate(u.created_at)}</span>
          </div>
          <span class="admin-role-badge role-${u.role}">${u.role.toUpperCase()}${u.is_master ? ' ★' : ''}</span>
        </div>
        ${!u.is_master ? `
        <div class="admin-order-footer">
          <div class="admin-field-label">ROLE:</div>
          <div class="admin-status-buttons">
            <button class="admin-status-btn ${u.role==='admin'?'active':''}" onclick="setUserRole('${u.id}','admin')">ADMIN</button>
            <button class="admin-status-btn ${u.role==='user'?'active':''}" onclick="setUserRole('${u.id}','user')">USER</button>
            <button class="admin-status-btn" style="border-color:#ff4466;color:#ff4466" onclick="deleteUser('${u.id}','${u.email}')">REMOVE</button>
          </div>
        </div>` : `<div style="padding:.75rem 1.25rem;font-family:var(--font-mono);font-size:.55rem;color:var(--cyan);letter-spacing:.1em">// MASTER ADMIN — PROTECTED</div>`}
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="admin-loading" style="color:#ff4466">// ERROR: ${err.message}</div>`;
  }
}

async function setUserRole(userId, role) {
  const sb = await getSupabase();
  await sb.from('profiles').update({ role }).eq('id', userId);
  loadAdminUsers();
}

async function deleteUser(userId, email) {
  if (!confirm(`Remove user ${email}? This cannot be undone.`)) return;
  const sb = await getSupabase();
  await sb.from('profiles').delete().eq('id', userId);
  loadAdminUsers();
}

async function inviteUser() {
  const email = document.getElementById('inviteEmail').value.trim();
  const role = document.getElementById('inviteRole').value;
  const msg = document.getElementById('inviteMsg');

  if (!email) { msg.textContent = '⚠ Enter an email address'; msg.style.color = '#ff4466'; return; }

  msg.textContent = 'Sending invite...';
  msg.style.color = 'var(--cyan)';

  try {
    const sb = await getSupabase();
    // Use Supabase admin invite
    const res = await fetch(`${(await fetch('/api/config').then(r=>r.json())).url}/auth/v1/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': (await fetch('/api/config').then(r=>r.json())).key,
        'Authorization': `Bearer ${(await sb.auth.getSession()).data.session.access_token}`
      },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      // Pre-set their role
      msg.textContent = '✓ Invite sent — they will receive an email to set their password.';
      msg.style.color = '#00ff88';
      document.getElementById('inviteEmail').value = '';
      // Role will be set by trigger, but update it if needed
      setTimeout(() => loadAdminUsers(), 2000);
    } else {
      const err = await res.json();
      throw new Error(err.message || 'Invite failed');
    }
  } catch (err) {
    msg.textContent = '⚠ ' + err.message;
    msg.style.color = '#ff4466';
  }
}

function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.admin-tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('adminTab-' + tab).style.display = 'block';
  event.target.classList.add('active');
  if (tab === 'users') loadAdminUsers();
}

// ── HELPERS ──
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatService(val) {
  const map = {
    consultation: 'Consultation', logo: 'Logo Design', flyer: 'Digital Flyers',
    brochure: 'Brochure Site', simple: '1–3 Page Build', standard: '3–5 Page Build',
    full: '5–10 Page Build', unsure: 'Needs Guidance'
  };
  return map[val] || val || '—';
}

// Enter key on login fields
document.addEventListener('DOMContentLoaded', () => {
  ['adminEmailInput','adminPasswordInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitAdminLogin();
        if (e.key === 'Escape') closeAdminLogin();
      });
    }
  });
});
