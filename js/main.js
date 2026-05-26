// Navigation toggle for mobile
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

// Work order form handling
const workOrderForm = document.getElementById('workOrderForm');
const successMsg = document.getElementById('successMsg');

if (workOrderForm) {
  workOrderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(workOrderForm);
    const data = Object.fromEntries(formData);
    
    // Log form data (in production, this would send to a server)
    console.log('Work Order Submitted:', data);
    
    // Hide form and show success message
    workOrderForm.style.display = 'none';
    successMsg.style.display = 'block';
    
    // Scroll to success message
    successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add active state to nav links based on current page
const currentPage = window.location.pathname.split('/').pop();
const navLinksItems = document.querySelectorAll('.nav-links a');

navLinksItems.forEach(link => {
  const linkPage = link.getAttribute('href');
  if (linkPage === currentPage || (currentPage === '' && linkPage === '../index.html')) {
    link.classList.add('active');
  }
});

// Phone number formatting
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

// Close mobile nav when clicking a link
if (navLinks) {
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });
}
