import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIFETIME_EMAILS = new Set(["maxeaseoficial@gmail.com", "supremacy830@gmail.com", "leonardo.froese@gmail.com"]);
const PRICE_MONTHLY = "price_1ToOauCxnlNVkiYcGGCBQmGO";
const PRICE_ANNUAL = "price_1ToQhwCxnlNVkiYcC7uRxKVw";

type Payload = {
  has_access: boolean;
  subscribed: boolean;
  lifetime: boolean;
  trial_active: boolean;
  trial_ends_at: string | null;
  trial_days_remaining: number | null;
  plan_name: string | null;
  subscription_end: string | null;
};

function reply(partial: Partial<Payload>, status = 200) {
  const body: Payload = {
    has_access: false,
    subscribed: false,
    lifetime: false,
    trial_active: false,
    trial_ends_at: null,
    trial_days_remaining: null,
    plan_name: null,
    subscription_end: null,
    ...partial,
  };
  body.has_access = body.has_access || body.subscribed || body.lifetime || body.trial_active;
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user?.email) throw new Error("Unauthorized");
    const user = userData.user;
    const email = user.email!.toLowerCase();

    // ---------- Trial bookkeeping (server-side only, created at most once) ----------
    // Eligibility marker: only accounts created after the trial launch get a trial,
    // so pre-existing non-paying accounts never receive a retroactive 7 days.
    let trialEndsAt: string | null = null;
    try {
      const { data: existingTrial } = await supabase
        .from("user_trials")
        .select("trial_ends_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingTrial) {
        trialEndsAt = existingTrial.trial_ends_at as string;
      } else {
        const { data: settings } = await supabase
          .from("trial_settings")
          .select("eligible_after")
          .maybeSingle();
        const eligibleAfter = settings?.eligible_after ? new Date(settings.eligible_after) : null;
        const accountCreatedAt = user.created_at ? new Date(user.created_at) : null;
        const eligible = Boolean(eligibleAfter && accountCreatedAt && accountCreatedAt >= eligibleAfter);
        if (eligible) {
          // Dates come from the database clock (defaults), never from the client.
          const { data: created } = await supabase
            .from("user_trials")
            .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true })
            .select("trial_ends_at")
            .maybeSingle();
          if (created) {
            trialEndsAt = created.trial_ends_at as string;
          } else {
            const { data: again } = await supabase
              .from("user_trials")
              .select("trial_ends_at")
              .eq("user_id", user.id)
              .maybeSingle();
            trialEndsAt = (again?.trial_ends_at as string) ?? null;
          }
        }
      }
    } catch (_e) {
      trialEndsAt = null;
    }

    const now = new Date();
    const trialActive = Boolean(trialEndsAt && new Date(trialEndsAt) > now);
    const trialDaysRemaining = trialActive
      ? Math.max(0, Math.ceil((new Date(trialEndsAt!).getTime() - now.getTime()) / 86400000))
      : null;
    const trialInfo = {
      trial_active: trialActive,
      trial_ends_at: trialEndsAt,
      trial_days_remaining: trialDaysRemaining,
    };

    // ---------- 1. Lifetime accounts ----------
    if (LIFETIME_EMAILS.has(email)) {
      return reply({
        ...trialInfo,
        subscribed: true,
        lifetime: true,
        plan_name: "Plano Vitalício",
      });
    }

    // ---------- 2. Manual overrides ----------
    const { data: override } = await supabase
      .from("user_plan_overrides")
      .select("plan_type, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (override) {
      const expires = override.expires_at ? new Date(override.expires_at) : null;
      if (!expires || expires > now) {
        return reply({
          ...trialInfo,
          subscribed: true,
          lifetime: override.plan_type === "lifetime",
          plan_name: override.plan_type === "lifetime" ? "Plano Vitalício" :
                     override.plan_type === "annual" ? "Plano Anual" : "Plano Mensal",
          subscription_end: override.expires_at,
        });
      }
    }

    // ---------- 3. Stripe subscription ----------
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      // ---------- 4. Trial ----------
      return reply(trialInfo);
    }
    const customerId = customers.data[0].id;

    const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    if (subs.data.length === 0) {
      return reply(trialInfo);
    }
    const sub = subs.data[0];
    const priceId = sub.items.data[0].price.id;
    const plan_name = priceId === PRICE_ANNUAL ? "Plano Anual" : priceId === PRICE_MONTHLY ? "Plano Mensal" : "Plano Ativo";
    const subscription_end = new Date((sub as any).current_period_end * 1000).toISOString();

    return reply({ ...trialInfo, subscribed: true, plan_name, subscription_end });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message, subscribed: false, has_access: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
