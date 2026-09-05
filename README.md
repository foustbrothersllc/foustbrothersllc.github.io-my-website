# Foust Brothers LLC — Digital Division

## File Structure

```
foust-brothers/
├── index.html          ← All pages (single-page app)
├── css/
│   └── style.css       ← All styles (mobile nav fix included)
├── js/
│   ├── content-data.js ← All site text, hardcoded (edit this to change copy)
│   ├── main.js         ← Navigation, clock, ticker, forms, routing
│   └── blob.js         ← Three.js orb animation (NO microphone)
└── vercel.json         ← Clean URL rewrites
```

## Changes in This Version

- **Fully static, no backend** — Supabase, the admin panel, admin login, and
  the CMS editor have all been removed. There is no database and no
  authentication anywhere on this site anymore.
- **Site text is hardcoded** — all copy lives in `js/content-data.js` as a
  plain JS object. To change any text on the site, edit that file and
  redeploy (push to GitHub / Vercel).
- **Work orders go straight to email** — the work order form submits
  directly to Web3Forms. There is no order dashboard; check your email
  for new submissions.
- **Mobile nav fixed** — hamburger now sits correctly on the right; clock hidden on mobile
- **Microphone removed** — blob orb uses simulated audio pulse, zero browser permissions
- **Code split** — CSS and JS extracted to separate files for easier maintenance

## Deploy to Vercel

### Option A — GitHub + Vercel (recommended)
1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import your repo
3. Click Deploy (no build settings needed — static HTML)

### Option B — Vercel CLI
```bash
npm i -g vercel
vercel
```

## Customization

- **Colors** — CSS variables at the top of `css/style.css`
- **Navigation / routing** — `js/main.js`
- **Orb animation** — `js/blob.js`
- **Page content** — `index.html` (each page is a `<div id="page-X" class="page">` block)

## Contact Form

Work orders are submitted via Web3Forms. The access key is already configured in `js/main.js`. No additional setup needed.
