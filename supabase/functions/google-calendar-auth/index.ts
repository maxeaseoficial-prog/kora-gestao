import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authed.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === 'status') {
      const { data } = await admin
        .from('google_calendar_tokens')
        .select('google_email, expires_at')
        .eq('user_id', userId)
        .maybeSingle();
      return json({ connected: !!data, google_email: data?.google_email ?? null });
    }

    if (action === 'config') {
      return json({ client_id: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID') || null });
    }

    if (action === 'disconnect') {
      await admin.from('google_calendar_tokens').delete().eq('user_id', userId);
      return json({ ok: true });
    }

    if (action === 'exchange') {
      const code = String(body.code || '');
      const redirectUri = String(body.redirect_uri || '');
      if (!code || !redirectUri) return json({ error: 'missing code/redirect_uri' }, 400);

      const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!;
      const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error('Google token exchange failed', tokenRes.status, tokenJson);
        return json({ error: 'google_exchange_failed', details: tokenJson }, 400);
      }

      const accessToken = tokenJson.access_token as string;
      const refreshToken = tokenJson.refresh_token as string | undefined;
      const expiresIn = Number(tokenJson.expires_in || 3600);
      const scope = tokenJson.scope as string | undefined;
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      // Fetch google email
      let googleEmail: string | null = null;
      try {
        const uiRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (uiRes.ok) {
          const ui = await uiRes.json();
          googleEmail = ui.email ?? null;
        }
      } catch (_) {}

      if (!refreshToken) {
        // If user already granted before, Google won't return refresh_token unless prompt=consent
        const existing = await admin
          .from('google_calendar_tokens')
          .select('refresh_token')
          .eq('user_id', userId)
          .maybeSingle();
        if (!existing.data?.refresh_token) {
          return json({ error: 'missing_refresh_token', hint: 'Reauthorize with prompt=consent' }, 400);
        }
        await admin.from('google_calendar_tokens').update({
          access_token: accessToken,
          expires_at: expiresAt,
          scope,
          google_email: googleEmail,
        }).eq('user_id', userId);
      } else {
        await admin.from('google_calendar_tokens').upsert({
          user_id: userId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          scope,
          google_email: googleEmail,
        }, { onConflict: 'user_id' });
      }

      return json({ ok: true, google_email: googleEmail });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: 'internal_error', message: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}