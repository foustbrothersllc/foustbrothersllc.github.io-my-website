// ═══════════════════════════════════════════════════════════
// js/content-data.js — Hardcoded CMS Content
// Replace Supabase dependency with static data
// ═══════════════════════════════════════════════════════════

const HARDCODED_CONTENT = {
  // ── SITE CONTROLS ──
  hero_visible: 'true',

  // ── HOME ──
  nav_status: 'ONLINE',
  hero_directive: '// INITIALIZE MISSION',
  hero_line1: 'FULL-STACK',
  hero_line2: 'WEB DEVELOPMENT',
  hero_line3: 'FOR MODERN BUSINESS',
  hero_sub: 'Strategic technology solutions that scale with your vision',
  hero_btn_primary: 'START A PROJECT',
  hero_btn_secondary: 'EXPLORE OUR WORK',
  boot_line1: 'SYSTEM INITIALIZED',
  boot_line2: 'SCANNING CAPABILITIES...',
  boot_line3: 'LOADING TECH STACK...',
  boot_line4: 'ENGAGING DEPLOYMENT PROTOCOLS...',
  boot_line5: 'READY FOR LAUNCH',
  sys_philosophy: 'We build technology that works',
  sys_standard: 'Industry standard practices at scale',
  sys_commitment: 'Committed to your success',
  sys_warranty: 'Backed by our guarantee',
  sys_status: '99.99% OPERATIONAL',
  sys_uptime: '99.99%',
  sys_billing: 'TRANSPARENT',
  sys_region: 'US EAST',

  // ── SERVICES ──
  svc_consultation_title: 'Consultation',
  svc_logo_title: 'Logo Design',
  svc_flyer_title: 'Digital Flyers',
  svc_brochure_title: 'Brochure Site',
  svc_simple_title: '1–3 Page Build',
  svc_standard_title: '3–5 Page Build',
  svc_full_title: '5–10 Page Build',

  // ── BILLING ──
  billing_intro: 'Transparent pricing for every stage of your project',
  price_tier1: '$2,400',
  price_tier2: '$4,800',
  price_tier3: '$8,400',
  price_retainer_mo: '$800/month',
  price_retainer_yr: '$8,400/year',
  rate_standard: '$75/hr',
  rate_overtime: '$112.50/hr',
  rate_rush: '1.5x',
  spec_logo_price: '$400–800',
  spec_logo_desc: 'Professional logo design with multiple concepts',
  spec_flyer_price: '$150–350',
  spec_flyer_desc: 'High-impact digital marketing collateral',
  spec_domain_price: '$12/year',
  spec_domain_desc: 'Domain registration and privacy protection',

  // ── ABOUT ──
  about_headline: 'We build technology that matters',

  // ── FOOTER ──
  footer_tagline: 'Full-stack web development for businesses that demand reliability',
  footer_motto: 'SHIP QUALITY CODE',
  footer_philosophy: 'Built with intention. Deployed with confidence.',

  // ── WORK ORDER ──
  step1: 'Describe your project, timeline, and vision',
  step2: 'We review and ask clarifying questions',
  step3: 'Receive a detailed quote and technical plan',
  step4: 'Go live and scale together',

  // ── CONTACT ──
  contact_phone: '(919) 555-0100'
};

// Export for use in main.js
if (typeof window !== 'undefined') {
  window.HARDCODED_CONTENT = HARDCODED_CONTENT;
}
