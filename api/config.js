export const config = { runtime: 'edge' };

export default function handler(req) {
  const origin = req.headers.get('origin') || '';

  // Allow requests from your own domain only
  const allowed = [
    'https://foustbrothers.com',
    'https://www.foustbrothers.com',
    'https://foust-brothers.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ];

  const isAllowed = allowed.some(o => origin === o) || origin === '';

  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  return new Response(
    JSON.stringify({
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_ANON_KEY
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    }
  );
}
