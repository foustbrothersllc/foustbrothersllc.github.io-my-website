# Foust Brothers LLC — Digital Division

Website for Foust Brothers LLC Digital Division.

## Setup — Contact Form

Before deploying, set up [Formspree](https://formspree.io) to receive work order emails:

1. Go to https://formspree.io and create a free account
2. Create a new form — use your email `FoustBrothersLLC@gmail.com`
3. Copy your **Form ID** (looks like `xpwzabcd`)
4. Open `js/main.js` and replace `YOUR_FORM_ID` with your actual ID:
   ```
   https://formspree.io/f/YOUR_FORM_ID  →  https://formspree.io/f/xpwzabcd
   ```
5. Free tier allows 50 submissions/month — more than enough to start

## Deploy to Vercel

### Option A — GitHub + Vercel (recommended)

1. Create a new GitHub repository at https://github.com/new
2. Push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Initial deploy"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Go to https://vercel.com → New Project → Import your GitHub repo
4. Click **Deploy** — no build settings needed (it's static HTML)

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
```

## Connect Your Domain

1. In Vercel dashboard → your project → **Settings → Domains**
2. Add your domain (e.g. `foustbrothers.com`)
3. Vercel will give you DNS records to add at your domain registrar
4. Usually takes 5–30 minutes to go live

## File Structure

```
foust-brothers/
├── index.html          ← Home page
├── css/
│   └── style.css       ← All styles
├── js/
│   └── main.js         ← Nav + form logic
├── pages/
│   ├── about.html
│   ├── billing.html
│   └── work-order.html
└── vercel.json         ← Clean URLs config
```

## Customization

- **Colors** — edit CSS variables at the top of `css/style.css`
- **Content** — edit any `.html` file directly
- **Form fields** — edit `pages/work-order.html`
