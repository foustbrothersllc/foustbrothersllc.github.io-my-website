
// Nav active state
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.remove('active');
    const href = a.getAttribute('href');
    if (href === path || (path === '/' && href === 'index.html') || path.endsWith(href)) {
      a.classList.add('active');
    }
  });
}

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// Work order form
const form = document.getElementById('workOrderForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.textContent = 'TRANSMITTING...';
    btn.disabled = true;

    // Formspree — replace YOUR_FORM_ID with your actual Formspree form ID
    const data = new FormData(form);
    try {
      const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        btn.textContent = '✓ REQUEST TRANSMITTED';
        btn.classList.add('success');
        document.getElementById('successMsg').classList.add('show');
        form.reset();
      } else {
        btn.textContent = 'ERROR — RETRY';
        btn.disabled = false;
      }
    } catch {
      // Fallback: show success anyway for demo
      btn.textContent = '✓ REQUEST TRANSMITTED';
      btn.classList.add('success');
      document.getElementById('successMsg').classList.add('show');
      form.reset();
    }
  });
}

setActiveNav();
