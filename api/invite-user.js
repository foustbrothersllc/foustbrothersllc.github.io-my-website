export const config = { runtime: 'edge' };

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';

  const allowed = [
    'https://foustbrothersllc.com',
    'https://www.foustbrothersllc.com',
    'https://foust-brothers.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ];

  const isAllowed = allowed.some(o => origin === o) || origin === '';
  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || '*'
  };

  try {
    const { email, role } = await req.json();

    if (!email || !role || !['admin', 'user'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid email or role' }), { status: 400, headers: corsHeaders });
    }

    // ── Verify the caller is authenticated ──
    const authHeader = req.headers.get('authorization') || '';
    const callerToken = authHeader.replace('Bearer ', '');
    if (!callerToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: corsHeaders });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Identify the calling user from their access token
    const callerRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${callerToken}`
      }
    });
    if (!callerRes.ok) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: corsHeaders });
    }
    const callerUser = await callerRes.json();

    // ── Verify the caller is admin or master in profiles table ──
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUser.id}&select=role,is_master`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`
        }
      }
    );
    const profiles = await profileRes.json();
    const callerProfile = profiles?.[0];

    if (!callerProfile || (callerProfile.role !== 'admin' && !callerProfile.is_master)) {
      return new Response(JSON.stringify({ error: 'Not authorized to invite users' }), { status: 403, headers: corsHeaders });
    }

    // Only master can create other admins; regular admins can only invite as 'user'
    if (role === 'admin' && !callerProfile.is_master) {
      return new Response(JSON.stringify({ error: 'Only master admin can invite admins' }), { status: 403, headers: corsHeaders });
    }

    // ── Send the invite via Supabase Admin API ──
    const inviteRes = await fetch(`${SUPABASE_URL}/auth/v1/invite`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const inviteData = await inviteRes.json();
    if (!inviteRes.ok) {
      return new Response(JSON.stringify({ error: inviteData.msg || inviteData.error_description || 'Invite failed' }), { status: 400, headers: corsHeaders });
    }

    // ── Set their role in profiles (upsert in case a trigger already created a default row) ──
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: inviteData.id,
        email,
        role,
        is_master: false
      })
    });

    return new Response(JSON.stringify({ success: true, user: inviteData }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500, headers: corsHeaders });
  }
}
