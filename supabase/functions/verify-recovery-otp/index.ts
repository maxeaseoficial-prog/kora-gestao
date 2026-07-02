import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { code, newPassword } = await req.json();
    if (typeof code !== 'string' || code.length !== 6) {
      return new Response(JSON.stringify({ error: 'invalid_code' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // newPassword is optional on first step (verify only); required on second step (reset).
    const isReset = typeof newPassword === 'string' && newPassword.length > 0;
    if (isReset && newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'weak_password' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const user = userData.user;

    const admin = createClient(supabaseUrl, serviceKey);
    const codeHash = await sha256(code);

    const { data: rows, error: qErr } = await admin
      .from('password_reset_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);
    if (qErr) throw qErr;
    const row = rows?.[0];
    if (!row) {
      return new Response(JSON.stringify({ error: 'no_code' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: 'expired' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (row.attempts >= 5) {
      await admin.from('password_reset_codes').update({ used: true }).eq('id', row.id);
      return new Response(JSON.stringify({ error: 'too_many_attempts' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (row.code_hash !== codeHash) {
      await admin.from('password_reset_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id);
      return new Response(JSON.stringify({ error: 'invalid_code' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!isReset) {
      // Verify-only step: keep code valid for the actual reset call.
      return new Response(JSON.stringify({ ok: true, verified: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Reset password via admin API and consume code
    const { error: updErr } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
    if (updErr) throw updErr;
    await admin.from('password_reset_codes').update({ used: true }).eq('id', row.id);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});