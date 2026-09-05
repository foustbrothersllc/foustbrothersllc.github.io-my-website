// ═══════════════════════════════════════════════════════════
// js/content-data.js — Hardcoded CMS Content
// Extracted directly from the Supabase `content` table on 2026-09-05.
// Replaces the Supabase dependency for content delivery.
// ═══════════════════════════════════════════════════════════

const HARDCODED_CONTENT = {
  // ── SITE CONTROLS ──
  hero_visible: 'false',

  // ── HOME ──
  nav_status: 'DIGITAL DIVISION // ONLINE',
  hero_directive: '— PRIMARY DIRECTIVE —',
  hero_line1: 'UNDER',
  hero_line2: 'PROMISE,',
  hero_line3: 'OVER DELIVER',
  hero_sub: 'FOUST BROTHERS LLC — DIGITAL DIVISION',
  hero_btn_primary: 'INITIALIZE REQUEST',
  hero_btn_secondary: 'VIEW SERVICES',
  boot_line1: '✓ INITIALIZING FOUST BROS SYSTEMS',
  boot_line2: '✓ LOADING DIGITAL PROTOCOLS',
  boot_line3: '✓ SCANNING NETWORK TOPOLOGY',
  boot_line4: '✓ ESTABLISHING SECURE UPLINK',
  boot_line5: '▶ ALL SYSTEMS NOMINAL',
  sys_philosophy: 'BUILT RIGHT. BUILT ONCE.',
  sys_standard: 'DETAILS MATTER HERE.',
  sys_commitment: 'YOU APPROVE. WE DELIVER.',
  sys_warranty: '30-DAY BUG WARRANTY.',
  sys_status: 'ONLINE',
  sys_uptime: '99.9%',
  sys_billing: 'TRANSPARENT',
  sys_region: 'LOCAL',

  // ── SERVICES ──
  svc_consultation_title: 'Consultation',
  svc_logo_title: 'Business Logo Design',
  svc_flyer_title: 'Digital Flyers',
  svc_brochure_title: 'Brochure Site Build',
  svc_simple_title: 'Simple 1-3 Page Build',
  svc_standard_title: 'Standard 3-5 Page Build',
  svc_full_title: 'Full 5-10 Page Build',

  // ── BILLING ──
  billing_intro: 'Transparent, flat-rate pricing. No surprises, no hidden fees — just honest rates and clear agreements.',
  price_tier1: '$250',
  price_tier2: '$500',
  price_tier3: '$750+',
  price_retainer_mo: 'Starting at $35',
  price_retainer_yr: ' Starting at $357',
  rate_standard: '$20',
  rate_overtime: '$30',
  rate_rush: '2.5x',
  spec_logo_price: '$50-$150',
  spec_logo_desc: 'Per project. Flat rate. Revisions included.',
  spec_flyer_price: '$35-$110',
  spec_flyer_desc: 'Per asset. Social, print, web formats.',
  spec_domain_price: '$10-$25',
  spec_domain_desc: 'Per year. Billed at registrar cost.',

  // ── ABOUT ──
  about_headline: 'BUILT ON A STRAIGHT-SHOOTING PHILOSOPHY',

  // ── FOOTER ──
  footer_tagline: '',
  footer_motto: 'UNDER PROMISE. OVER DELIVER. EVERY TIME.',
  footer_philosophy: 'PHILOSOPHY: UNDER PROMISE — OVER DELIVER',

  // ── WORK ORDER ──
  step1: 'Fill out the work order form with as much detail as possible.',
  step2: 'We review your request within 1 business day and reach out to confirm scope.',
  step3: 'You receive a detailed, itemized quote. No hidden fees. You approve before work begins.',
  step4: 'We build it. You approve it. We deploy it. 30-day bug warranty included.',

  // ── CONTACT ──
  contact_phone: '(336) 862-2999'
};

// Export for use in main.js
if (typeof window !== 'undefined') {
  window.HARDCODED_CONTENT = HARDCODED_CONTENT;
}
