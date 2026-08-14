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
    const email = userData.user.email.toLowerCase();

    if (LIFETIME_EMAILS.has(email)) {
      return new Response(JSON.stringify({
        subscribed: true,
        lifetime: true,
        plan_name: "Plano Vitalício",
        subscription_end: null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Check for manual overrides in DB
    const { data: override } = await supabase
      .from("user_plan_overrides")
      .select("plan_type, expires_at")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (override) {
      const now = new Date();
      const expires = override.expires_at ? new Date(override.expires_at) : null;
      if (!expires || expires > now) {
        return new Response(JSON.stringify({
          subscribed: true,
          lifetime: override.plan_type === "lifetime",
          plan_name: override.plan_type === "lifetime" ? "Plano Vitalício" : 
                     override.plan_type === "annual" ? "Plano Anual" : "Plano Mensal",
          subscription_end: override.expires_at,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });


    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false, lifetime: false, plan_name: null, subscription_end: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }
    const customerId = customers.data[0].id;

    const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    if (subs.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false, lifetime: false, plan_name: null, subscription_end: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }
    const sub = subs.data[0];
    const priceId = sub.items.data[0].price.id;
    const plan_name = priceId === PRICE_ANNUAL ? "Plano Anual" : priceId === PRICE_MONTHLY ? "Plano Mensal" : "Plano Ativo";
    const subscription_end = new Date((sub as any).current_period_end * 1000).toISOString();

    return new Response(JSON.stringify({ subscribed: true, lifetime: false, plan_name, subscription_end }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message, subscribed: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});