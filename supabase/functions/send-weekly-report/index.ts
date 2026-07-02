import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const LOGO_URL =
  "https://kora-gestao.lovable.app/__l5e/assets-v1/6951d7bd-1569-49ce-be69-270c613efcf4/kora-email-logo.png";
const APP_URL = "https://www.koragestaointeligente.com.br";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
const fmtDate = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

interface Metric {
  icon: string;
  label: string;
  value: string;
  desc?: string;
}

function card(m: Metric) {
  return `
    <td style="padding:8px;vertical-align:top;width:33.33%;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:18px;">
        <div style="font-size:22px;line-height:1;margin-bottom:8px;">${m.icon}</div>
        <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${m.label}</div>
        <div style="font-size:20px;color:#0f172a;font-weight:700;margin-top:6px;">${m.value}</div>
        ${m.desc ? `<div style="font-size:12px;color:#6b7280;margin-top:4px;">${m.desc}</div>` : ""}
      </div>
    </td>`;
}

function metricsGrid(items: Metric[]) {
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += 3) {
    const chunk = items.slice(i, i + 3);
    while (chunk.length < 3) chunk.push({ icon: "", label: "", value: "" } as Metric);
    rows.push(
      `<tr>${chunk.map((m) => (m.label ? card(m) : `<td style="width:33.33%;"></td>`)).join("")}</tr>`,
    );
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;">${rows.join("")}</table>`;
}

function section(title: string, subtitle: string, content: string) {
  return `
    <tr><td style="padding:32px 32px 0 32px;">
      <h2 style="margin:0;font-size:18px;color:#0f172a;font-weight:700;letter-spacing:-0.2px;">${title}</h2>
      ${subtitle ? `<p style="margin:4px 0 16px 0;color:#6b7280;font-size:13px;">${subtitle}</p>` : `<div style="height:12px;"></div>`}
      ${content}
    </td></tr>`;
}

function emptyMsg(text: string) {
  return `<div style="background:#f9fafb;border:1px dashed #e5e7eb;border-radius:12px;padding:20px;text-align:center;color:#6b7280;font-size:14px;">${text}</div>`;
}

function buildEmail(params: {
  userName: string;
  periodStart: Date;
  periodEnd: Date;
  general: Metric[];
  finance: Metric[] | null;
  crm: Metric[] | null;
  crmOpenLeads: { name: string; company?: string | null }[];
  clients: Metric[] | null;
  productsSvc: Metric[] | null;
  purchases: Metric[] | null;
  goal: { value: number; achieved: number; percent: number } | null;
  upcoming: { name: string; value: number; date: string }[];
  timeline: string[];
  insights: string[];
}) {
  const {
    userName, periodStart, periodEnd,
    general, finance, crm, crmOpenLeads, clients, productsSvc, purchases,
    goal, upcoming, timeline, insights,
  } = params;

  const openLeadsHtml = crmOpenLeads.length
    ? `<div style="margin-top:12px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        ${crmOpenLeads.map((l, i) => `
          <div style="padding:12px 16px;${i > 0 ? "border-top:1px solid #f1f5f9;" : ""}">
            <div style="font-size:14px;color:#0f172a;font-weight:600;">${l.name}</div>
            ${l.company ? `<div style="font-size:12px;color:#6b7280;">${l.company}</div>` : ""}
          </div>`).join("")}
      </div>` : "";

  const goalHtml = goal
    ? `<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280;">
          <span>Meta mensal: <strong style="color:#0f172a;">${brl(goal.value)}</strong></span>
          <span>Alcançado: <strong style="color:#0f172a;">${brl(goal.achieved)}</strong></span>
        </div>
        <div style="margin-top:12px;height:10px;background:#f1f5f9;border-radius:999px;overflow:hidden;">
          <div style="height:10px;width:${Math.min(100, goal.percent)}%;background:#0f172a;border-radius:999px;"></div>
        </div>
        <div style="margin-top:8px;font-size:13px;color:#0f172a;font-weight:600;">${goal.percent.toFixed(0)}% concluída</div>
      </div>` : "";

  const upcomingHtml = upcoming.length
    ? `<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        ${upcoming.map((u, i) => `
          <div style="padding:14px 16px;${i > 0 ? "border-top:1px solid #f1f5f9;" : ""}display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:14px;color:#0f172a;font-weight:600;">${u.name}</div>
              <div style="font-size:12px;color:#6b7280;">${u.date}</div>
            </div>
            <div style="font-size:14px;color:#0f172a;font-weight:700;">${brl(u.value)}</div>
          </div>`).join("")}
      </div>` : "";

  const timelineHtml = timeline.length
    ? `<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:8px 4px;">
        ${timeline.map((t) => `
          <div style="padding:10px 16px;font-size:14px;color:#334155;">
            <span style="display:inline-block;width:18px;color:#059669;font-weight:700;">✔</span>${t}
          </div>`).join("")}
      </div>` : "";

  const insightsHtml = insights.length
    ? `<div style="background:#0f172a;border-radius:12px;padding:20px;color:#f8fafc;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;margin-bottom:10px;">Insights inteligentes</div>
        ${insights.map((i) => `<div style="font-size:14px;line-height:1.6;margin-top:6px;">• ${i}</div>`).join("")}
      </div>` : "";

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Relatório Semanal KORA</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06);">
      <tr><td style="padding:40px 32px 24px 32px;text-align:center;background:#ffffff;border-bottom:1px solid #f1f5f9;">
        <img src="${LOGO_URL}" alt="KORA" width="140" style="display:block;margin:0 auto 24px auto;max-width:140px;height:auto;"/>
        <div style="font-size:11px;letter-spacing:3px;color:#94a3b8;font-weight:600;">RELATÓRIO SEMANAL</div>
        <h1 style="margin:8px 0 8px 0;font-size:28px;color:#0f172a;font-weight:700;letter-spacing:-0.5px;">Sua semana na KORA</h1>
        <p style="margin:0;color:#6b7280;font-size:14px;">Confira o resumo da sua empresa referente aos últimos 7 dias.</p>
        <div style="margin-top:16px;display:inline-block;padding:6px 14px;background:#f1f5f9;border-radius:999px;font-size:12px;color:#475569;font-weight:600;">
          Período: ${fmtDate(periodStart)} a ${fmtDate(periodEnd)}
        </div>
      </td></tr>

      <tr><td style="padding:32px 32px 0 32px;">
        <p style="margin:0;font-size:16px;color:#0f172a;">Olá, <strong>${userName}</strong>.</p>
        <p style="margin:8px 0 0 0;color:#475569;font-size:14px;line-height:1.6;">
          Preparamos um resumo da sua semana na KORA para que você acompanhe rapidamente a evolução do seu negócio.
        </p>
      </td></tr>

      ${section("Resumo geral", "Principais indicadores dos últimos 7 dias", metricsGrid(general))}
      ${finance ? section("Financeiro", "Movimentações da semana", metricsGrid(finance)) : section("Financeiro", "", emptyMsg("Nenhuma movimentação financeira registrada nesta semana."))}
      ${crm ? section("CRM", "Evolução do seu funil de vendas", metricsGrid(crm) + openLeadsHtml) : ""}
      ${clients ? section("Clientes", "Atualizações da sua base", metricsGrid(clients)) : ""}
      ${productsSvc ? section("Produtos e Serviços", "Catálogo atualizado", metricsGrid(productsSvc)) : ""}
      ${purchases ? section("Compras", "Aquisições registradas", metricsGrid(purchases)) : ""}
      ${goal ? section("Metas", "Progresso da sua meta mensal", goalHtml) : ""}
      ${upcoming.length ? section("Próximos vencimentos", "Recorrências previstas", upcomingHtml) : ""}
      ${timeline.length ? section("Resumo da atividade", "Tudo o que aconteceu nos últimos 7 dias", timelineHtml) : ""}
      ${insights.length ? section("", "", insightsHtml) : ""}

      <tr><td style="padding:36px 32px;text-align:center;">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:-0.2px;">Acessar plataforma →</a>
      </td></tr>

      <tr><td style="padding:24px 32px 40px 32px;background:#fafafa;border-top:1px solid #f1f5f9;text-align:center;">
        <img src="${LOGO_URL}" alt="KORA" width="80" style="display:block;margin:0 auto 12px auto;max-width:80px;height:auto;opacity:0.85;"/>
        <p style="margin:0;font-size:14px;color:#0f172a;font-weight:600;">Obrigado por utilizar a KORA para gerenciar sua empresa.</p>
        <p style="margin:8px auto 16px auto;font-size:12px;color:#94a3b8;max-width:420px;line-height:1.6;">
          Este relatório foi gerado automaticamente com base nas informações cadastradas na plataforma durante os últimos 7 dias.
        </p>
        <div style="font-size:12px;color:#6b7280;">
          <a href="${APP_URL}" style="color:#0f172a;text-decoration:none;font-weight:600;">Plataforma</a>
          <span style="color:#e5e7eb;padding:0 8px;">•</span>
          <a href="${APP_URL}/privacidade" style="color:#0f172a;text-decoration:none;font-weight:600;">Política de Privacidade</a>
          <span style="color:#e5e7eb;padding:0 8px;">•</span>
          <a href="${APP_URL}/termos" style="color:#0f172a;text-decoration:none;font-weight:600;">Termos de Uso</a>
        </div>
        <p style="margin:16px 0 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} KORA — Gestão Inteligente</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}

async function buildReportForUser(admin: any, userId: string, userEmail: string, userMeta: any) {
  const now = new Date();
  const end = now;
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const startDate = start.toISOString().slice(0, 10);

  const [
    { data: finances },
    { data: expenses },
    { data: clients },
    { data: products },
    { data: services },
    { data: crmCards },
    { data: crmColumns },
    { data: monthlyGoals },
  ] = await Promise.all([
    admin.from("finance_entries").select("*").eq("user_id", userId),
    admin.from("expenses").select("*").eq("user_id", userId),
    admin.from("clients").select("*").eq("user_id", userId),
    admin.from("products").select("*").eq("user_id", userId),
    admin.from("services").select("*").eq("user_id", userId),
    admin.from("crm_cards").select("*").eq("user_id", userId),
    admin.from("crm_columns").select("*").eq("user_id", userId),
    admin.from("monthly_goals").select("*").eq("user_id", userId)
      .eq("year", now.getFullYear()).eq("month", now.getMonth() + 1).limit(1),
  ]);

  const inWeek = (d: string) => d && d >= startDate;
  const inWeekCreated = (d: string) => d && d >= startIso && d <= endIso;

  const weekFinances = (finances || []).filter((f: any) => inWeek(f.entry_date));
  const weekExpenses = (expenses || []).filter((e: any) => inWeek(e.entry_date));
  const receita = weekFinances.reduce((s: number, f: any) => s + Number(f.value || 0), 0);
  const despesas = weekExpenses.reduce((s: number, e: any) => s + Number(e.value || 0), 0);
  const lucro = receita - despesas;

  const allReceita = (finances || []).reduce((s: number, f: any) => s + Number(f.value || 0), 0);
  const allDespesas = (expenses || []).reduce((s: number, e: any) => s + Number(e.value || 0), 0);
  const saldo = allReceita - allDespesas;

  const activeClients = (clients || []).filter((c: any) => c.status === "ativo");
  const newClients = (clients || []).filter((c: any) => inWeekCreated(c.created_at));
  const endedClients = (clients || []).filter((c: any) => c.status === "inativo" && c.deactivated_at && inWeek(c.deactivated_at));
  const recorrencias = (clients || []).filter((c: any) => c.recurrence === "mensal" && c.status === "ativo");

  const newProducts = (products || []).filter((p: any) => inWeekCreated(p.created_at));
  const newServices = (services || []).filter((s: any) => inWeekCreated(s.created_at));
  const compras = weekFinances.filter((f: any) => f.kind === "compra" || f.entry_type === "compra");

  // General
  const general: Metric[] = [
    { icon: "💰", label: "Receita da semana", value: brl(receita) },
    { icon: "📉", label: "Despesas da semana", value: brl(despesas) },
    { icon: "📈", label: "Lucro da semana", value: brl(lucro) },
    { icon: "🏦", label: "Saldo atual", value: brl(saldo) },
    { icon: "👥", label: "Clientes ativos", value: String(activeClients.length) },
    { icon: "✨", label: "Novos clientes", value: String(newClients.length) },
    { icon: "📦", label: "Produtos cadastrados", value: String((products || []).length) },
    { icon: "🧰", label: "Serviços cadastrados", value: String((services || []).length) },
    { icon: "🔁", label: "Recorrências ativas", value: String(recorrencias.length) },
  ];

  // Finance
  const maiorEntrada = weekFinances.reduce((m: any, f: any) => (!m || Number(f.value) > Number(m.value) ? f : m), null as any);
  const maiorDespesa = weekExpenses.reduce((m: any, e: any) => (!m || Number(e.value) > Number(m.value) ? e : m), null as any);
  const ticket = weekFinances.length ? receita / weekFinances.length : 0;
  const finance = (weekFinances.length + weekExpenses.length) > 0 ? [
    { icon: "⬆️", label: "Total de entradas", value: brl(receita) },
    { icon: "⬇️", label: "Total de saídas", value: brl(despesas) },
    { icon: "💵", label: "Lucro líquido", value: brl(lucro) },
    { icon: "🎟️", label: "Ticket médio", value: brl(ticket) },
    { icon: "🏆", label: "Maior entrada", value: brl(Number(maiorEntrada?.value || 0)), desc: maiorEntrada?.client_name || "—" },
    { icon: "⚠️", label: "Maior despesa", value: brl(Number(maiorDespesa?.value || 0)), desc: maiorDespesa?.description || maiorDespesa?.category || "—" },
  ] as Metric[] : null;

  // CRM
  const wonCol = (crmColumns || []).find((c: any) => /ganhou/i.test(c.title))?.id;
  const lostCol = (crmColumns || []).find((c: any) => /perdeu/i.test(c.title))?.id;
  const newLeads = (crmCards || []).filter((c: any) => inWeekCreated(c.created_at));
  const wonLeads = (crmCards || []).filter((c: any) => c.column_id === wonCol);
  const lostLeads = (crmCards || []).filter((c: any) => c.column_id === lostCol);
  const openLeads = (crmCards || []).filter((c: any) => c.column_id !== wonCol && c.column_id !== lostCol);
  const crm = (crmCards || []).length > 0 ? [
    { icon: "🆕", label: "Leads cadastrados", value: String(newLeads.length) },
    { icon: "🏅", label: "Leads ganhos", value: String(wonLeads.length) },
    { icon: "❌", label: "Leads perdidos", value: String(lostLeads.length) },
    { icon: "🤝", label: "Em andamento", value: String(openLeads.length) },
  ] as Metric[] : null;
  const crmOpenLeads = openLeads.slice(0, 5).map((l: any) => ({ name: l.client_name, company: l.company }));

  const clientsSec = (clients || []).length > 0 ? [
    { icon: "✨", label: "Novos na semana", value: String(newClients.length) },
    { icon: "✅", label: "Ativos", value: String(activeClients.length) },
    { icon: "🚪", label: "Encerrados", value: String(endedClients.length) },
  ] as Metric[] : null;

  const productsSvc = ((products || []).length + (services || []).length) > 0 ? [
    { icon: "📦", label: "Produtos", value: String((products || []).length), desc: `${newProducts.length} novos` },
    { icon: "🧰", label: "Serviços", value: String((services || []).length), desc: `${newServices.length} novos` },
  ] as Metric[] : null;

  const purchases = compras.length > 0 ? [
    { icon: "🛒", label: "Compras realizadas", value: String(compras.length) },
    { icon: "💳", label: "Valor total", value: brl(compras.reduce((s: number, c: any) => s + Number(c.value || 0), 0)) },
    { icon: "🕒", label: "Última compra", value: fmtDate(new Date(compras[compras.length - 1].entry_date)) },
  ] as Metric[] : null;

  // Goal
  const monthGoal = monthlyGoals?.[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthRevenue = (finances || []).filter((f: any) => f.entry_date >= monthStart).reduce((s: number, f: any) => s + Number(f.value || 0), 0);
  const goal = monthGoal && Number(monthGoal.value) > 0 ? {
    value: Number(monthGoal.value),
    achieved: monthRevenue,
    percent: (monthRevenue / Number(monthGoal.value)) * 100,
  } : null;

  // Upcoming recurring: clients with recurrence=mensal, active, with contract_day in next 7 days
  const upcoming: { name: string; value: number; date: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const day = d.getDate();
    activeClients.filter((c: any) => c.recurrence === "mensal" && c.contract_day === day)
      .forEach((c: any) => upcoming.push({ name: c.name, value: Number(c.monthly_value || 0), date: fmtDate(d) }));
  }

  // Timeline
  const timeline: string[] = [];
  if (newClients.length) timeline.push(`${newClients.length} novo(s) cliente(s) cadastrado(s)`);
  if (endedClients.length) timeline.push(`${endedClients.length} cliente(s) encerrado(s)`);
  if (newProducts.length) timeline.push(`${newProducts.length} produto(s) adicionado(s)`);
  if (newServices.length) timeline.push(`${newServices.length} serviço(s) adicionado(s)`);
  if (weekFinances.length) timeline.push(`${weekFinances.length} lançamento(s) financeiro(s)`);
  if (weekExpenses.length) timeline.push(`${weekExpenses.length} despesa(s) registrada(s)`);
  if (newLeads.length) timeline.push(`${newLeads.length} novo(s) lead(s) no CRM`);
  if (wonLeads.length) timeline.push(`${wonLeads.length} lead(s) marcado(s) como ganho`);

  // Insights: compare with previous 7 days
  const prevStart = new Date(start.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const prevReceita = (finances || []).filter((f: any) => f.entry_date >= prevStart && f.entry_date < startDate).reduce((s: number, f: any) => s + Number(f.value || 0), 0);
  const prevDespesas = (expenses || []).filter((e: any) => e.entry_date >= prevStart && e.entry_date < startDate).reduce((s: number, e: any) => s + Number(e.value || 0), 0);
  const insights: string[] = [];
  if (prevReceita > 0) {
    const diff = ((receita - prevReceita) / prevReceita) * 100;
    if (Math.abs(diff) >= 5) insights.push(`Sua receita ${diff >= 0 ? "aumentou" : "diminuiu"} ${Math.abs(diff).toFixed(0)}% em relação à semana anterior.`);
  }
  if (prevDespesas > 0 && despesas < prevDespesas) insights.push(`Suas despesas diminuíram ${(((prevDespesas - despesas) / prevDespesas) * 100).toFixed(0)}% em relação à semana anterior.`);
  if (newClients.length > endedClients.length) insights.push(`Você conquistou mais clientes do que perdeu nesta semana.`);
  if (compras.length === 0) insights.push(`Nenhuma compra foi registrada nesta semana.`);
  if (goal) insights.push(`Sua meta mensal está ${goal.percent.toFixed(0)}% concluída.`);

  const userName = userMeta?.name || userMeta?.full_name || userEmail.split("@")[0];

  return {
    hasContent:
      general.some((g) => g.value !== "R$ 0,00" && g.value !== "0") ||
      timeline.length > 0 ||
      (crmCards || []).length > 0,
    html: buildEmail({
      userName, periodStart: start, periodEnd: end,
      general, finance, crm, crmOpenLeads, clients: clientsSec, productsSvc, purchases,
      goal, upcoming, timeline, insights,
    }),
    periodStart: start, periodEnd: end,
  };
}

async function sendResend(to: string, subject: string, html: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!lovableKey || !resendKey) throw new Error("Missing LOVABLE_API_KEY or RESEND_API_KEY");

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: "KORA <relatorio@koragestaointeligente.com.br>",
      to: [to],
      subject,
      html,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Resend ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const cronSecret = Deno.env.get("WEEKLY_REPORT_CRON_SECRET");
    const providedSecret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
    const authHeader = req.headers.get("Authorization");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Determine target: single user (authenticated preview) or all users (cron)
    let targets: { id: string; email: string; meta: any }[] = [];
    let testMode = false;

    if (providedSecret && providedSecret === cronSecret) {
      const { data: usersRes, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;
      targets = (usersRes.users || [])
        .filter((u) => u.email)
        .map((u) => ({ id: u.id, email: u.email!, meta: u.user_metadata || {} }));
    } else if (authHeader) {
      const anon = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error } = await anon.auth.getUser(token);
      if (error || !userData.user?.email) throw new Error("Unauthorized");
      testMode = true;
      const overrideTo = url.searchParams.get("to");
      targets = [{
        id: userData.user.id,
        email: overrideTo || userData.user.email,
        meta: userData.user.user_metadata || {},
      }];
    } else {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: any[] = [];
    for (const t of targets) {
      try {
        const report = await buildReportForUser(admin, t.id, t.email, t.meta);
        if (!testMode && !report.hasContent) {
          results.push({ email: t.email, skipped: true, reason: "no_activity" });
          continue;
        }
        const subject = `Seu relatório semanal KORA — ${fmtDate(report.periodStart)} a ${fmtDate(report.periodEnd)}`;
        const send = await sendResend(t.email, subject, report.html);
        results.push({ email: t.email, ok: true, id: send?.id });
      } catch (e) {
        results.push({ email: t.email, ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(JSON.stringify({ sent: results.filter((r) => r.ok).length, total: targets.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});