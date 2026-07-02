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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user?.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const user = userData.user;
    const email = user.email!;

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const admin = createClient(supabaseUrl, serviceKey);
    // Invalidate old unused codes
    await admin.from('password_reset_codes').update({ used: true }).eq('user_id', user.id).eq('used', false);
    const { error: insErr } = await admin.from('password_reset_codes').insert({
      user_id: user.id,
      email,
      code_hash: codeHash,
      expires_at: expiresAt,
    });
    if (insErr) throw insErr;

    // Send via Resend gateway
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!lovableKey || !resendKey) throw new Error('Email service not configured');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background:#ffffff;">
        <h1 style="color:#000; font-size:22px; margin:0 0 16px;">Recuperação de senha — KORA</h1>
        <p style="color:#333; font-size:15px;">Use o código abaixo para redefinir sua senha. Ele expira em 15 minutos.</p>
        <div style="font-size:36px; font-weight:700; letter-spacing:8px; text-align:center; padding:20px; background:#000; color:#fff; border-radius:8px; margin:24px 0;">${code}</div>
        <p style="color:#666; font-size:13px;">Se você não solicitou essa alteração, ignore este e-mail.</p>
        <p style="color:#999; font-size:12px; margin-top:32px;">KORA Gestão Inteligente</p>
      </div>`;

    const resp = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': resendKey,
      },
      body: JSON.stringify({
        from: 'KORA <no-reply@koragestaointeligente.com.br>',
        to: [email],
        subject: 'Seu código de recuperação — KORA',
        html,
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      console.error('Resend error', resp.status, t);
      throw new Error(`Failed to send email: ${resp.status}`);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});