import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  Target as TargetIcon,
  TrendingUp,
  Users,
  Kanban,
  Wallet,
  Receipt,
  CalendarRange,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import { isClientActiveInMonth, getRecurringRevenueForMonth } from '@/lib/revenue';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const monthAbbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const monthFull = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function initials(name: string) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

function Dashboard() {
  const { clients, finances, crmCards, crmColumns, hideNumbers, setHideNumbers } = useApp();
  const { user } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Annual goal + manual monthly overrides (from Faturamento module)
  const [annualGoal, setAnnualGoal] = useState<number>(0);
  const [manualRevenue, setManualRevenue] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: goal }, { data: manuals }] = await Promise.all([
        supabase
          .from('annual_goals')
          .select('goal_value')
          .eq('user_id', user.id)
          .eq('year', selectedYear)
          .maybeSingle(),
        supabase
          .from('manual_monthly_revenue')
          .select('month, value')
          .eq('user_id', user.id)
          .eq('year', selectedYear),
      ]);
      if (cancelled) return;
      setAnnualGoal(Number(goal?.goal_value) || 0);
      const map: Record<number, number> = {};
      (manuals || []).forEach((m: any) => {
        map[m.month] = Number(m.value) || 0;
      });
      setManualRevenue(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, selectedYear]);

  // ---- Current month metrics ----
  const activeClientsList = useMemo(
    () => clients.filter((c) => isClientActiveInMonth(c, selectedYear, selectedMonth)),
    [clients, selectedYear, selectedMonth],
  );
  const activeClients = activeClientsList.length;
  const currentRecurrence = getRecurringRevenueForMonth(clients, selectedYear, selectedMonth);
  const totalCards = crmCards.length;

  const filteredFinances = useMemo(
    () =>
      finances.filter((f) => {
        const d = new Date(f.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }),
    [finances, selectedMonth, selectedYear],
  );

  const monthlyRevenue = filteredFinances.reduce((acc, f) => acc + f.value, 0);
  const totalMonth = monthlyRevenue + currentRecurrence;
  const ticketMedio = monthlyRevenue / (filteredFinances.length || 1);

  const recentEntries = useMemo(
    () =>
      [...filteredFinances]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [filteredFinances],
  );

  // ---- 12-month evolution for selected year ----
  const monthlyTotals = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      if (manualRevenue[m] !== undefined) return manualRevenue[m];
      const incomes = finances
        .filter((f) => {
          const d = new Date(f.date);
          return d.getFullYear() === selectedYear && d.getMonth() === m;
        })
        .reduce((acc, f) => acc + f.value, 0);
      const rec = getRecurringRevenueForMonth(clients, selectedYear, m);
      return incomes + rec;
    });
  }, [finances, clients, selectedYear, manualRevenue]);

  const yearTotal = monthlyTotals.reduce((a, b) => a + b, 0);
  const goalProgress = annualGoal > 0 ? Math.min(100, (yearTotal / annualGoal) * 100) : 0;
  const monthsElapsed = Math.max(1, selectedMonth + 1);
  const projection = (yearTotal / monthsElapsed) * 12;

  // ---- Smart goal redistribution ----
  // For each month m, dynamically compute its (recalculated) monthly target
  // based on the remaining annual goal divided by remaining months.
  const goalPlan = useMemo(() => {
    const initialMonthly = annualGoal > 0 ? annualGoal / 12 : 0;
    const plan: { meta: number; realized: number; diff: number; status: 'ok' | 'warn' | 'bad' | 'future' }[] = [];
    let remaining = annualGoal;
    for (let m = 0; m < 12; m++) {
      const monthsLeft = 12 - m;
      const meta = remaining > 0 && monthsLeft > 0 ? remaining / monthsLeft : 0;
      const isPast = m < selectedMonth;
      const isCurrent = m === selectedMonth;
      const realized = isPast || isCurrent ? monthlyTotals[m] : 0;
      const diff = realized - meta;
      let status: 'ok' | 'warn' | 'bad' | 'future' = 'future';
      if (isPast || isCurrent) {
        if (meta <= 0) status = 'ok';
        else if (realized >= meta) status = 'ok';
        else if (realized >= meta * 0.7) status = 'warn';
        else status = 'bad';
      }
      plan.push({ meta, realized, diff, status });
      if (isPast || isCurrent) remaining = Math.max(0, remaining - realized);
      else remaining = Math.max(0, remaining - meta);
    }
    return { plan, initialMonthly };
  }, [annualGoal, monthlyTotals, selectedMonth]);

  const currentMonthGoal = goalPlan.plan[selectedMonth]?.meta || 0;
  const currentMonthRealized = monthlyTotals[selectedMonth] || 0;
  const monthGoalProgress = currentMonthGoal > 0
    ? Math.min(100, (currentMonthRealized / currentMonthGoal) * 100)
    : 0;
  const monthGoalRemaining = Math.max(0, currentMonthGoal - currentMonthRealized);
  const monthGoalMissingPct = currentMonthGoal > 0
    ? Math.max(0, 100 - monthGoalProgress)
    : 0;

  const goalTone =
    monthGoalProgress >= 80 ? 'ok' : monthGoalProgress >= 50 ? 'warn' : 'bad';
  const goalToneClasses: Record<string, { bar: string; text: string; chip: string; glow: string }> = {
    ok:   { bar: 'bg-emerald-400', text: 'text-emerald-400', chip: 'bg-emerald-400/10 text-emerald-300', glow: 'shadow-[0_0_24px_-6px_rgba(52,211,153,0.6)]' },
    warn: { bar: 'bg-amber-400',   text: 'text-amber-400',   chip: 'bg-amber-400/10 text-amber-300',   glow: 'shadow-[0_0_24px_-6px_rgba(251,191,36,0.55)]' },
    bad:  { bar: 'bg-rose-400',    text: 'text-rose-400',    chip: 'bg-rose-400/10 text-rose-300',    glow: 'shadow-[0_0_24px_-6px_rgba(251,113,133,0.55)]' },
  };

  // ---- Annual planning summary ----
  const realizedYearToDate = monthlyTotals
    .slice(0, selectedMonth + 1)
    .reduce((a, b) => a + b, 0);
  const annualRemaining = Math.max(0, annualGoal - realizedYearToDate);
  const monthsRemaining = Math.max(0, 11 - selectedMonth);
  const requiredPerRemainingMonth =
    monthsRemaining > 0 ? annualRemaining / monthsRemaining : annualRemaining;

  // Previous month for trend
  const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const prevTotal = useMemo(() => {
    const incomes = finances
      .filter((f) => {
        const d = new Date(f.date);
        return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
      })
      .reduce((acc, f) => acc + f.value, 0);
    return incomes + getRecurringRevenueForMonth(clients, prevYear, prevMonth);
  }, [finances, clients, prevMonth, prevYear]);

  const monthDelta = prevTotal > 0 ? ((totalMonth - prevTotal) / prevTotal) * 100 : 0;

  // Sparkline path (last 6 month totals up to selectedMonth)
  const sparkPoints = useMemo(() => {
    const start = Math.max(0, selectedMonth - 5);
    const slice = monthlyTotals.slice(start, selectedMonth + 1);
    if (slice.length === 0) return '';
    const max = Math.max(...slice, 1);
    const min = Math.min(...slice, 0);
    const range = max - min || 1;
    const step = 100 / Math.max(1, slice.length - 1);
    return slice
      .map((v, i) => {
        const x = i * step;
        const y = 20 - ((v - min) / range) * 18 - 1;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [monthlyTotals, selectedMonth]);

  // ---- Formatters ----
  const formatCurrency = (value: number) => {
    if (hideNumbers) return '•••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  const formatShortCurrency = (value: number) => {
    if (hideNumbers) return '•••••';
    if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };
  const formatNumber = (value: number) => (hideNumbers ? '••' : value.toString());
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(date));

  const chartMax = Math.max(...monthlyTotals, 1);

  // Sora + Manrope scoped via className on root
  return (
    <div className="dark -m-4 lg:-m-6 min-h-[calc(100vh-4rem)] bg-[#0a0a0a] text-[#fafafa] p-4 md:p-6 lg:p-8" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <style>{`
        .dash-heading { font-family: 'Sora', sans-serif; letter-spacing: -0.02em; }
        .dash-card { background: #141414; border: 1px solid rgba(255,255,255,0.05); border-radius: 1.5rem; transition: border-color .3s ease, background .3s ease, box-shadow .3s ease, transform .3s ease; }
        .dash-card:hover { border-color: rgba(255,255,255,0.18); box-shadow: 0 0 40px -16px rgba(255,255,255,0.08); }
        .dash-card-soft:hover { background: #1a1a1a; }
        .dash-stagger > * { opacity: 0; animation: dashIn .5s ease-out forwards; }
        @keyframes dashIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#171717] border border-white/10 rounded-lg">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="dash-heading text-xl font-bold">Dashboard</h1>
              <p className="text-xs text-[#a1a1a1]">
                {monthFull[selectedMonth]} {selectedYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MonthYearPicker
              month={selectedMonth}
              year={selectedYear}
              onChange={(m, y) => {
                setSelectedMonth(m);
                setSelectedYear(y);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHideNumbers(!hideNumbers)}
              className="gap-2 rounded-full bg-[#171717] border-white/10 hover:bg-[#1f1f1f] hover:text-white"
            >
              {hideNumbers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {hideNumbers ? 'Mostrar' : 'Ocultar'} Valores
            </Button>
          </div>
        </header>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 dash-stagger">
          {/* Faturamento Total — hero */}
          <div className="md:col-span-2 lg:col-span-2 dash-card p-6 group" style={{ animationDelay: '0ms' }}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm text-[#a1a1a1]">Faturamento Total do Mês</span>
              {!hideNumbers && prevTotal > 0 && (
                <span className={`flex items-center text-xs px-2 py-0.5 rounded-full ${monthDelta >= 0 ? 'text-white bg-white/10' : 'text-[#a1a1a1] bg-white/5'}`}>
                  {monthDelta >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {Math.abs(monthDelta).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="dash-heading text-3xl font-bold mb-1">{formatCurrency(totalMonth)}</div>
            <p className="text-xs text-[#666] mb-4">Receita + Recorrência</p>
            <div className="h-12 w-full">
              {sparkPoints && (
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full text-white overflow-visible">
                  <path d={sparkPoints} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>

          {/* Meta Anual */}
          <div className="md:col-span-2 lg:col-span-2 dash-card p-6 flex items-center justify-between gap-4" style={{ animationDelay: '60ms' }}>
            <div className="space-y-1 min-w-0">
              <span className="text-sm text-[#a1a1a1]">Meta Anual {selectedYear}</span>
              <div className="dash-heading text-2xl font-bold">
                {annualGoal > 0 ? `${goalProgress.toFixed(0)}%` : '—'}
              </div>
              <div className="text-xs text-[#a1a1a1] truncate">
                {hideNumbers
                  ? '••••• / •••••'
                  : annualGoal > 0
                    ? `${formatShortCurrency(yearTotal)} / ${formatShortCurrency(annualGoal)}`
                    : 'Defina a meta em Faturamento'}
              </div>
              {annualGoal > 0 && (
                <div className="text-[10px] text-[#666] pt-1">
                  Projeção: {formatShortCurrency(projection)}
                </div>
              )}
            </div>
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                <circle
                  cx="40" cy="40" r="34"
                  stroke="currentColor" strokeWidth="6" fill="transparent"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - goalProgress / 100)}
                  className="text-white transition-all duration-700"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                <TargetIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Meta Mensal Inteligente */}
          <div className="md:col-span-4 lg:col-span-2 dash-card p-6" style={{ animationDelay: '90ms' }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-sm text-[#a1a1a1] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Meta Mensal
                </span>
                <p className="text-[10px] text-[#666] mt-0.5">Recalculada automaticamente</p>
              </div>
              {annualGoal > 0 && (
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${goalToneClasses[goalTone].chip}`}>
                  {monthGoalProgress >= 100 ? 'Meta batida' : `Faltam ${monthGoalMissingPct.toFixed(0)}%`}
                </span>
              )}
            </div>
            <div className="dash-heading text-2xl font-bold mb-1">
              {annualGoal > 0 ? formatCurrency(currentMonthGoal) : '—'}
            </div>
            <div className="text-xs text-[#a1a1a1] mb-4">
              {annualGoal > 0
                ? (hideNumbers
                    ? '••••• realizado'
                    : `${formatShortCurrency(currentMonthRealized)} realizado · faltam ${formatShortCurrency(monthGoalRemaining)}`)
                : 'Defina a meta anual em Faturamento'}
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${goalToneClasses[goalTone].bar} ${goalToneClasses[goalTone].glow}`}
                style={{ width: `${monthGoalProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#666] mt-2 tabular-nums">
              <span>0%</span>
              <span className={goalToneClasses[goalTone].text}>{monthGoalProgress.toFixed(0)}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Receita do Mês */}
          <div className="lg:col-span-1 dash-card dash-card-soft p-5" style={{ animationDelay: '120ms' }}>
            <span className="text-xs text-[#a1a1a1] block mb-2">Receita Mês</span>
            <div className="dash-heading text-xl font-bold mb-2">{formatCurrency(monthlyRevenue)}</div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-700"
                style={{ width: `${totalMonth > 0 ? Math.min(100, (monthlyRevenue / totalMonth) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Recorrência */}
          <div className="lg:col-span-1 dash-card dash-card-soft p-5" style={{ animationDelay: '180ms' }}>
            <span className="text-xs text-[#a1a1a1] block mb-2">Recorrência</span>
            <div className="dash-heading text-xl font-bold mb-2">{formatCurrency(currentRecurrence)}</div>
            <div className="flex items-center gap-1 text-[10px] text-[#666]">
              <TrendingUp className="w-3 h-3" />
              {hideNumbers ? '••' : `${activeClients} contratos`}
            </div>
          </div>

          {/* Clientes Ativos */}
          <div className="lg:col-span-1 dash-card dash-card-soft p-5" style={{ animationDelay: '240ms' }}>
            <span className="text-xs text-[#a1a1a1] block mb-2 flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Clientes Ativos
            </span>
            <div className="dash-heading text-xl font-bold mb-2">{formatNumber(activeClients)}</div>
            <div className="text-[10px] text-[#666]">Ativos no mês</div>
          </div>

          {/* Leads CRM */}
          <div className="lg:col-span-1 dash-card dash-card-soft p-5" style={{ animationDelay: '300ms' }}>
            <span className="text-xs text-[#a1a1a1] block mb-2 flex items-center gap-1.5">
              <Kanban className="w-3 h-3" /> Leads no CRM
            </span>
            <div className="dash-heading text-xl font-bold mb-2">{formatNumber(totalCards)}</div>
            <div className="text-[10px] text-[#666]">
              {hideNumbers ? '•••' : `Em ${crmColumns.length} etapas`}
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="lg:col-span-1 dash-card dash-card-soft p-5" style={{ animationDelay: '360ms' }}>
            <span className="text-xs text-[#a1a1a1] block mb-2 flex items-center gap-1.5">
              <Receipt className="w-3 h-3" /> Ticket Médio
            </span>
            <div className="dash-heading text-xl font-bold mb-2">{formatCurrency(ticketMedio)}</div>
            <div className="text-[10px] text-[#666]">
              {hideNumbers ? '••' : `${filteredFinances.length} entradas`}
            </div>
          </div>

          {/* Filler small slot for symmetry on lg (col 5-6) */}
          <div className="hidden lg:block lg:col-span-1 dash-card dash-card-soft p-5" style={{ animationDelay: '420ms' }}>
            <span className="text-xs text-[#a1a1a1] block mb-2">Acumulado {selectedYear}</span>
            <div className="dash-heading text-xl font-bold mb-2">{formatShortCurrency(yearTotal)}</div>
            <div className="text-[10px] text-[#666]">
              {monthsElapsed} {monthsElapsed === 1 ? 'mês' : 'meses'} computados
            </div>
          </div>

          {/* Evolução 12 meses */}
          <div className="md:col-span-4 lg:col-span-4 dash-card p-6" style={{ animationDelay: '480ms' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="dash-heading font-semibold text-white">Evolução de Faturamento</h3>
                <p className="text-xs text-[#666]">12 meses de {selectedYear}</p>
              </div>
              <div className="text-right">
                <div className="dash-heading text-sm font-bold">{formatShortCurrency(yearTotal)}</div>
                <div className="text-[10px] text-[#666]">total no ano</div>
              </div>
            </div>
            <div className="w-full">
              <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="w-full h-48 overflow-visible">
                {/* baseline grid */}
                {[0.25, 0.5, 0.75, 1].map((g) => (
                  <line
                    key={g}
                    x1="0"
                    x2="600"
                    y1={200 - g * 180}
                    y2={200 - g * 180}
                    stroke="rgba(255,255,255,0.04)"
                    strokeDasharray="2 4"
                  />
                ))}
                {monthlyTotals.map((v, i) => {
                  const barW = 600 / 12;
                  const innerW = barW * 0.55;
                  const x = i * barW + (barW - innerW) / 2;
                  const h = chartMax > 0 ? Math.max(2, (v / chartMax) * 180) : 2;
                  const y = 200 - h;
                  const isCurrent = i === selectedMonth;
                  return (
                    <g key={i}>
                      <title>{`${monthFull[i]}: ${hideNumbers ? '•••' : formatCurrency(v)}`}</title>
                      <rect
                        x={x}
                        y={y}
                        width={innerW}
                        height={h}
                        rx={3}
                        className={`transition-all duration-500 ${isCurrent ? 'fill-white' : 'fill-white/10 hover:fill-white/30'}`}
                        style={{
                          transformOrigin: `${x + innerW / 2}px 200px`,
                          animation: `barGrow 0.6s ease-out ${i * 40}ms both`,
                        }}
                      />
                    </g>
                  );
                })}
                <style>{`@keyframes barGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }`}</style>
              </svg>
              <div className="flex justify-between mt-2 px-1">
                {monthAbbr.map((m, i) => (
                  <span
                    key={m}
                    className={`text-[10px] uppercase tracking-wider flex-1 text-center ${
                      i === selectedMonth ? 'text-white font-bold' : 'text-[#666]'
                    }`}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Status CRM */}
          <div className="md:col-span-2 lg:col-span-2 dash-card p-6" style={{ animationDelay: '540ms' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="dash-heading font-semibold">Status do CRM</h3>
              <span className="text-[10px] text-[#666]">{hideNumbers ? '••' : totalCards} total</span>
            </div>
            <div className="space-y-5">
              {crmColumns.length === 0 && (
                <p className="text-xs text-[#666] text-center py-8">Nenhuma etapa configurada</p>
              )}
              {crmColumns.map((column, idx) => {
                const cardsInColumn = crmCards.filter((c) => c.columnId === column.id).length;
                const pct = totalCards > 0 ? (cardsInColumn / totalCards) * 100 : 0;
                // emphasis grows down the funnel
                const opacity = 0.2 + (idx / Math.max(1, crmColumns.length - 1)) * 0.8;
                return (
                  <div key={column.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#a1a1a1]">{column.title}</span>
                      <span className="font-medium">
                        {hideNumbers ? '••' : String(cardsInColumn).padStart(2, '0')} cards
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `rgba(255,255,255,${opacity.toFixed(2)})` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Planejamento Anual */}
          <div className="md:col-span-4 lg:col-span-6 dash-card p-6" style={{ animationDelay: '570ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                  <CalendarRange className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="dash-heading font-semibold">Planejamento Anual</h3>
                  <p className="text-[10px] text-[#666]">Projeção inteligente para {selectedYear}</p>
                </div>
              </div>
              {annualGoal > 0 && (
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${goalToneClasses[goalTone].chip}`}>
                  {goalProgress.toFixed(0)}% do ano
                </span>
              )}
            </div>
            {annualGoal <= 0 ? (
              <p className="text-sm text-[#666] text-center py-8">
                Defina sua meta anual na aba <span className="text-white">Faturamento</span> para ativar o planejamento inteligente.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: 'Meta Anual', value: formatShortCurrency(annualGoal) },
                    { label: 'Acumulado', value: formatShortCurrency(realizedYearToDate) },
                    { label: 'Restante', value: formatShortCurrency(annualRemaining) },
                    { label: 'Meses restantes', value: hideNumbers ? '••' : String(monthsRemaining) },
                    { label: 'Necessário/mês', value: formatShortCurrency(requiredPerRemainingMonth) },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">{stat.label}</p>
                      <p className="dash-heading text-lg font-bold tabular-nums">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Comparative bar: ideal vs current vs required */}
                <div className="space-y-3">
                  {[
                    { label: 'Ideal acumulado', value: (annualGoal / 12) * (selectedMonth + 1), color: 'bg-white/30' },
                    { label: 'Faturamento atual', value: realizedYearToDate, color: goalToneClasses[goalTone].bar },
                    { label: 'Projeção fim de ano', value: projection, color: 'bg-sky-400/60' },
                  ].map((row) => {
                    const pct = annualGoal > 0 ? Math.min(100, (row.value / annualGoal) * 100) : 0;
                    return (
                      <div key={row.label} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#a1a1a1]">{row.label}</span>
                          <span className="dash-heading font-bold tabular-nums">
                            {formatShortCurrency(row.value)}{' '}
                            <span className="text-[10px] text-[#666] font-normal">({pct.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.color} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Tabela inteligente de Metas Mensais */}
          <div className="md:col-span-4 lg:col-span-6 dash-card overflow-hidden" style={{ animationDelay: '585ms' }}>
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="dash-heading font-semibold">Metas Mensais</h3>
                <p className="text-[10px] text-[#666] mt-0.5">Redistribuição automática conforme performance</p>
              </div>
              {annualGoal > 0 && (
                <span className="text-[10px] text-[#a1a1a1]">
                  Meta inicial: {formatShortCurrency(goalPlan.initialMonthly)}/mês
                </span>
              )}
            </div>
            {annualGoal <= 0 ? (
              <p className="text-sm text-[#666] text-center py-10">Sem meta anual definida.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-[10px] text-[#666] uppercase tracking-widest border-b border-white/5">
                      <th className="px-6 py-3 font-bold">Mês</th>
                      <th className="px-6 py-3 font-bold text-right">Meta</th>
                      <th className="px-6 py-3 font-bold text-right">Realizado</th>
                      <th className="px-6 py-3 font-bold text-right">Diferença</th>
                      <th className="px-6 py-3 font-bold">Progresso</th>
                      <th className="px-6 py-3 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {goalPlan.plan.map((row, i) => {
                      const isCurrent = i === selectedMonth;
                      const isFuture = i > selectedMonth;
                      const pct = row.meta > 0 ? Math.min(100, (row.realized / row.meta) * 100) : 0;
                      const tone = goalToneClasses[row.status === 'future' ? 'warn' : row.status];
                      const statusLabel = isFuture
                        ? 'Projetado'
                        : row.realized >= row.meta
                          ? 'Batida'
                          : pct >= 70
                            ? 'Em curso'
                            : 'Abaixo';
                      return (
                        <tr key={i} className={`hover:bg-white/[0.02] transition-colors ${isCurrent ? 'bg-white/[0.03]' : ''}`}>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{monthFull[i]}</span>
                              {isCurrent && (
                                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-black font-bold">Atual</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums dash-heading font-semibold">
                            {formatShortCurrency(row.meta)}
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums">
                            {isFuture ? <span className="text-[#666]">—</span> : formatShortCurrency(row.realized)}
                          </td>
                          <td className={`px-6 py-3 text-right tabular-nums font-semibold ${
                            isFuture ? 'text-[#666]' : row.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isFuture ? '—' : `${row.diff >= 0 ? '+' : '−'}${formatShortCurrency(Math.abs(row.diff))}`}
                          </td>
                          <td className="px-6 py-3 min-w-[140px]">
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${isFuture ? 'bg-white/15' : tone.bar}`}
                                style={{ width: `${isFuture ? 0 : pct}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`text-[9px] font-semibold px-2 py-1 rounded-full ${
                              isFuture ? 'bg-white/5 text-[#a1a1a1]' : tone.chip
                            }`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Entradas do Mês */}
          <div className="md:col-span-4 lg:col-span-6 dash-card overflow-hidden" style={{ animationDelay: '660ms' }}>
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="dash-heading font-semibold">Entradas do Mês</h3>
                <p className="text-[10px] text-[#666] mt-0.5">Últimos {recentEntries.length} lançamentos</p>
              </div>
              <span className="text-xs text-[#a1a1a1]">{formatCurrency(monthlyRevenue)}</span>
            </div>
            <div className="divide-y divide-white/5">
              {recentEntries.length === 0 && (
                <p className="text-sm text-[#666] text-center py-10">Nenhuma entrada neste mês</p>
              )}
              {recentEntries.map((entry) => (
                <div key={entry.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {initials(entry.clientName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{entry.clientName}</p>
                      <p className="text-[10px] text-[#666] uppercase tracking-wider">{entry.type}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <p className="dash-heading text-sm font-bold tabular-nums">{formatCurrency(entry.value)}</p>
                    <p className="text-[10px] text-[#666]">{formatDate(entry.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clientes Ativos */}
          <div className="md:col-span-4 lg:col-span-6 dash-card overflow-hidden" style={{ animationDelay: '660ms' }}>
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="dash-heading font-semibold">Clientes Ativos no Mês</h3>
              <span className="text-xs text-[#a1a1a1]">{hideNumbers ? '••' : activeClients} clientes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[10px] text-[#666] uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4 font-bold">Cliente</th>
                    <th className="px-6 py-4 font-bold">Empresa</th>
                    <th className="px-6 py-4 font-bold">Serviço</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Valor Mensal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeClientsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-[#666] text-sm">
                        Nenhum cliente ativo neste mês
                      </td>
                    </tr>
                  )}
                  {activeClientsList.map((client) => (
                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold">
                            {initials(client.name)}
                          </div>
                          <span className="font-medium">{client.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#a1a1a1]">{client.company || '—'}</td>
                      <td className="px-6 py-4">
                        {client.serviceType ? (
                          <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider">
                            {client.serviceType}
                          </span>
                        ) : (
                          <span className="text-[#666]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                          Ativo
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right dash-heading font-bold tabular-nums">
                        {formatCurrency(client.monthlyValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
