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
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

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
    const { data: tokenRow } = await admin
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!tokenRow) return json({ error: 'not_connected' }, 400);

    let accessToken = tokenRow.access_token as string;
    const expiresAt = new Date(tokenRow.expires_at as string).getTime();

    if (Date.now() > expiresAt - 60_000) {
      const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!;
      const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!;
      const rRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokenRow.refresh_token as string,
          grant_type: 'refresh_token',
        }),
      });
      const rJson = await rRes.json();
      if (!rRes.ok) {
        console.error('refresh failed', rRes.status, rJson);
        return json({ error: 'refresh_failed', details: rJson }, 400);
      }
      accessToken = rJson.access_token;
      const newExpiresAt = new Date(Date.now() + Number(rJson.expires_in || 3600) * 1000).toISOString();
      await admin.from('google_calendar_tokens').update({
        access_token: accessToken,
        expires_at: newExpiresAt,
      }).eq('user_id', userId);
    }

    const body = await req.json().catch(() => ({}));
    const timeMin = String(body.timeMin || new Date().toISOString());
    const timeMax = String(body.timeMax || new Date(Date.now() + 30 * 86400_000).toISOString());

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '500');

    const evRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const evJson = await evRes.json();
    if (!evRes.ok) {
      console.error('events fetch failed', evRes.status, evJson);
      return json({ error: 'events_failed', details: evJson }, evRes.status);
    }

    return json({ events: evJson.items || [] });
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