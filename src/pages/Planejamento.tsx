import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePlanning, MonthlyGoalRow } from '@/hooks/usePlanning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Target, Plus, Pencil, TrendingUp, Calendar, BarChart3, ListChecks, Sparkles, Wallet, Flag, Timer, Activity } from 'lucide-react';
import { computeHealth, daysInMonth, daysElapsed, formatBRL, formatShortBRL, getRealizedForMonth } from '@/lib/planning';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, Area, AreaChart, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function Planejamento() {
  const { user } = useAuth();
  const { clients, finances } = useApp();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0..11

  const plan = usePlanning(year);

  // ----- Computed core metrics for selected month -----
  const monthGoalRow = plan.monthly.find(m => m.month === month + 1);
  const monthGoal = monthGoalRow?.value ?? (plan.annual ? plan.annual.goal_value / 12 : 0);
  const monthRealized = useMemo(() => getRealizedForMonth(finances, clients, year, month), [finances, clients, year, month]);
  const remaining = Math.max(0, monthGoal - monthRealized);
  const percent = monthGoal > 0 ? Math.min(1, monthRealized / monthGoal) : 0;
  const dim = daysInMonth(year, month);
  const elapsed = daysElapsed(year, month);
  const daysLeft = Math.max(0, dim - elapsed);
  const perDay = daysLeft > 0 ? remaining / daysLeft : 0;
  const ritmoDiario = elapsed > 0 ? monthRealized / elapsed : 0;
  const projection = ritmoDiario * dim;
  const monthFraction = dim > 0 ? elapsed / dim : 0;
  const health = computeHealth(percent, monthFraction);

  // tips
  const tips = useMemo(() => {
    const t: string[] = [];
    if (monthGoal > 0 && remaining > 0 && daysLeft > 0) {
      t.push(`Você precisa faturar ${formatBRL(perDay)} por dia para atingir a meta.`);
    }
    if (percent >= 1) t.push('Meta do mês batida. Excelente trabalho!');
    else if (percent >= monthFraction) t.push('Você está acima do ritmo esperado.');
    else if (monthFraction > 0) t.push(`Você está ${((monthFraction - percent) * 100).toFixed(0)}% abaixo do ritmo ideal — acelere as próximas semanas.`);
    if (projection > 0 && monthGoal > 0) {
      const diff = projection - monthGoal;
      if (diff >= 0) t.push(`Mantendo este ritmo, você fechará o mês com ${formatBRL(projection)} (${formatBRL(diff)} acima da meta).`);
      else t.push(`Mantendo este ritmo, faltarão ${formatBRL(-diff)} para fechar a meta.`);
    }
    if (!t.length) t.push('Defina sua meta mensal para começar a acompanhar.');
    return t;
  }, [monthGoal, remaining, daysLeft, perDay, monthFraction, percent, projection]);

  // ----- Tab: render -----
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/40 p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-foreground/[0.04] blur-3xl" />
        <div className="absolute -left-10 -bottom-20 h-40 w-40 rounded-full bg-foreground/[0.03] blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-foreground text-background shadow-lg">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Planejamento e Metas</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Centro estratégico do seu negócio</p>
            </div>
          </div>
          <div className="flex gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[150px] bg-background/60 backdrop-blur"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[110px] bg-background/60 backdrop-blur"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 7 }, (_, i) => today.getFullYear() - 3 + i).map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1">
          <TabsTrigger value="overview" className="py-2.5"><TrendingUp className="h-4 w-4 mr-1.5" />Visão Geral</TabsTrigger>
          <TabsTrigger value="annual" className="py-2.5"><Calendar className="h-4 w-4 mr-1.5" />Metas Anuais</TabsTrigger>
          <TabsTrigger value="monthly" className="py-2.5"><ListChecks className="h-4 w-4 mr-1.5" />Metas Mensais</TabsTrigger>
          <TabsTrigger value="progress" className="py-2.5"><BarChart3 className="h-4 w-4 mr-1.5" />Progresso</TabsTrigger>
        </TabsList>

        {/* ============= VISÃO GERAL ============= */}
        <TabsContent value="overview" className="space-y-5 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Hero — Radial gauge */}
            <Card className="lg:col-span-1 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Status do mês
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-2">
                <div className="relative w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="75%" outerRadius="100%" data={[{ name: 'meta', value: Math.min(100, percent * 100), fill: 'hsl(var(--foreground))' }]} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={20} background={{ fill: 'hsl(var(--secondary))' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold tabular-nums">{(percent * 100).toFixed(0)}%</span>
                    <span className={`mt-1 text-xs font-medium ${health.colorClass}`}>● {health.label}</span>
                  </div>
                </div>
                <div className="w-full mt-2 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Realizado</p>
                    <p className="text-sm font-semibold tabular-nums mt-0.5">{formatBRL(monthRealized)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Meta</p>
                    <p className="text-sm font-semibold tabular-nums mt-0.5">{formatBRL(monthGoal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI grid */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <StatCard icon={<Wallet className="h-4 w-4" />} label="Restante" value={formatBRL(remaining)} hint={`de ${formatBRL(monthGoal)}`} />
              <StatCard icon={<Timer className="h-4 w-4" />} label="Dias restantes" value={String(daysLeft)} hint={`${elapsed}/${dim} decorridos`} />
              <StatCard icon={<Flag className="h-4 w-4" />} label="Necessário/dia" value={formatBRL(perDay)} hint={daysLeft > 0 ? `nos próximos ${daysLeft} dias` : 'mês encerrado'} />
              <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Projeção fim do mês" value={formatBRL(projection)} hint={projection >= monthGoal ? 'acima da meta' : 'abaixo da meta'} />
            </div>
          </div>

          {/* Daily evolution */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Evolução de {MONTHS[month]}</CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-foreground" /> Realizado</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/60" /> Meta ideal</span>
              </div>
            </CardHeader>
            <CardContent>
              <OverviewDailyChart year={year} month={month} monthGoal={monthGoal} finances={finances} />
            </CardContent>
          </Card>

          {/* Scenarios + Tips */}
          <div className="grid md:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Cenários de fechamento</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <ScenarioRow label="Mantendo ritmo" value={projection} base={monthGoal} highlight />
                <ScenarioRow label="Acelerando 10%" value={projection * 1.1} base={monthGoal} />
                <ScenarioRow label="Caindo 10%" value={projection * 0.9} base={monthGoal} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> Insights inteligentes</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm">
                  {tips.map((t, i) => (
                    <li key={i} className="flex gap-2.5 leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============= METAS ANUAIS ============= */}
        <TabsContent value="annual" className="mt-6">
          <AnnualTab year={year} plan={plan} finances={finances} clients={clients} />
        </TabsContent>

        {/* ============= METAS MENSAIS ============= */}
        <TabsContent value="monthly" className="mt-6">
          <MonthlyTab year={year} plan={plan} finances={finances} clients={clients} />
        </TabsContent>

        {/* ============= PROGRESSO ============= */}
        <TabsContent value="progress" className="mt-6">
          <ProgressTab year={year} month={month} plan={plan} finances={finances} clients={clients} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Helpers / sub-components
// ============================================================

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="p-1.5 rounded-md bg-secondary text-muted-foreground">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ScenarioRow({ label, value, base, highlight }: { label: string; value: number; base: number; highlight?: boolean }) {
  const pct = base > 0 ? Math.min(150, (value / base) * 100) : 0;
  const above = value >= base;
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'border-foreground/30 bg-secondary/50' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{formatBRL(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-foreground transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {above ? `+${formatBRL(value - base)} acima da meta` : `${formatBRL(base - value)} abaixo da meta`}
      </p>
    </div>
  );
}

function OverviewDailyChart({ year, month, monthGoal, finances }: { year: number; month: number; monthGoal: number; finances: any[] }) {
  const dim = daysInMonth(year, month);
  const today = new Date();
  const isCurrent = today.getFullYear() === year && today.getMonth() === month;
  const todayDay = isCurrent ? today.getDate() : dim;
  const data = Array.from({ length: dim }, (_, i) => {
    const day = i + 1;
    const realized = day <= todayDay
      ? finances.filter((f: any) => {
          const d = new Date(f.date);
          return d.getFullYear() === year && d.getMonth() === month && d.getDate() <= day;
        }).reduce((a: number, f: any) => a + Number(f.value || 0), 0)
      : null;
    return { day: String(day).padStart(2, '0'), Realizado: realized, Meta: (monthGoal / dim) * day };
  });
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="realizedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => formatShortBRL(Number(v))} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={60} />
        <Tooltip
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
          formatter={(v: any) => v == null ? '—' : formatBRL(Number(v))}
          labelFormatter={(l) => `Dia ${l}`}
        />
        <Line type="monotone" dataKey="Meta" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
        <Area type="monotone" dataKey="Realizado" stroke="hsl(var(--foreground))" strokeWidth={2.5} fill="url(#realizedGradient)" connectNulls={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// AnnualTab
// ============================================================
function AnnualTab({ year, plan, finances, clients }: any) {
  const [open, setOpen] = useState(false);
  const [goalValue, setGoalValue] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setGoalValue(plan.annual ? String(plan.annual.goal_value) : '');
    setDescription(plan.annual?.description || '');
  }, [plan.annual]);

  const realized = useMemo(() => {
    let acc = 0;
    for (let m = 0; m < 12; m++) acc += getRealizedForMonth(finances, clients, year, m);
    return acc;
  }, [finances, clients, year]);

  const annual = plan.annual?.goal_value || 0;
  const remaining = Math.max(0, annual - realized);
  const percent = annual > 0 ? Math.min(100, (realized / annual) * 100) : 0;
  const perMonth = annual > 0 ? annual / 12 : 0;

  const data = Array.from({ length: 12 }, (_, m) => ({
    name: MONTH_SHORT[m],
    meta: plan.monthly.find((g: MonthlyGoalRow) => g.month === m + 1)?.value ?? perMonth,
    realizado: getRealizedForMonth(finances, clients, year, m),
  }));

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="relative p-6 bg-gradient-to-br from-card via-card to-secondary/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Meta anual</p>
              <p className="mt-1 text-4xl font-bold tabular-nums">{formatBRL(annual)}</p>
              {plan.annual?.description && <p className="mt-2 text-sm text-muted-foreground max-w-md">{plan.annual.description}</p>}
            </div>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />{annual > 0 ? 'Editar meta' : 'Cadastrar meta'}
            </Button>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>{formatBRL(realized)} realizados</span>
              <span className="font-medium text-foreground">{percent.toFixed(0)}%</span>
              <span>{formatBRL(remaining)} restantes</span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-foreground transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-border divide-x divide-border">
          <div className="p-4"><p className="text-xs text-muted-foreground">Realizado</p><p className="mt-1 text-base font-semibold tabular-nums">{formatBRL(realized)}</p></div>
          <div className="p-4"><p className="text-xs text-muted-foreground">Restante</p><p className="mt-1 text-base font-semibold tabular-nums">{formatBRL(remaining)}</p></div>
          <div className="p-4"><p className="text-xs text-muted-foreground">% atingido</p><p className="mt-1 text-base font-semibold tabular-nums">{percent.toFixed(0)}%</p></div>
          <div className="p-4"><p className="text-xs text-muted-foreground">Necessário/mês</p><p className="mt-1 text-base font-semibold tabular-nums">{formatBRL(perMonth)}</p></div>
        </div>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Distribuição mensal</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-foreground" /> Realizado</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-muted-foreground/40" /> Meta</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatShortBRL(Number(v))} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.5 }}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => formatBRL(Number(v))}
              />
              <Bar dataKey="meta" fill="hsl(var(--muted-foreground) / 0.35)" name="Meta" radius={[6,6,0,0]} />
              <Bar dataKey="realizado" fill="hsl(var(--foreground))" name="Realizado" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{annual > 0 ? 'Editar meta anual' : 'Cadastrar meta anual'} — {year}</DialogTitle>
            <DialogDescription>O valor será distribuído automaticamente nos 12 meses (meses editados manualmente serão preservados).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Valor da meta</Label>
              <Input type="number" step="0.01" value={goalValue} onChange={(e) => setGoalValue(e.target.value)} placeholder="Ex: 240000" />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Resumo da meta" />
            </div>
          </div>
          <DialogFooter>
            {annual > 0 && (
              <Button
                variant="destructive"
                className="mr-auto"
                onClick={async () => {
                  if (!confirm('Excluir a meta anual e zerar todos os meses de ' + year + '?')) return;
                  const db: any = supabase;
                  if (plan.annual?.id) await db.from('annual_goals').delete().eq('id', plan.annual.id);
                  const { data: { user: u } } = await supabase.auth.getUser();
                  if (u) await db.from('monthly_goals').delete().eq('user_id', u.id).eq('year', year);
                  await plan.logEvent('annual_goal_deleted', `Meta anual ${year} excluída`);
                  await plan.reload();
                  toast.success('Meta anual excluída');
                  setOpen(false);
                }}
              >Excluir meta</Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={async () => {
              const v = Number(goalValue);
              if (!v || v <= 0) { toast.error('Informe um valor válido'); return; }
              await plan.saveAnnual(v, description);
              toast.success('Meta anual salva');
              setOpen(false);
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// MonthlyTab
// ============================================================
function MonthlyTab({ year, plan, finances, clients }: any) {
  const [editMonth, setEditMonth] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<{ month: number; value: number } | null>(null);
  const [dupOpen, setDupOpen] = useState<number | null>(null);
  const [dupTarget, setDupTarget] = useState(0);

  const rows = Array.from({ length: 12 }, (_, m) => {
    const goalRow = plan.monthly.find((g: MonthlyGoalRow) => g.month === m + 1);
    const meta = goalRow?.value ?? (plan.annual ? plan.annual.goal_value / 12 : 0);
    const realized = getRealizedForMonth(finances, clients, year, m);
    const remaining = Math.max(0, meta - realized);
    const pct = meta > 0 ? (realized / meta) * 100 : 0;
    return { month: m, meta, realized, remaining, pct, isManual: goalRow?.is_manual };
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Metas mensais — {year}</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-3">Mês</th>
              <th className="py-2 pr-3">Meta</th>
              <th className="py-2 pr-3">Realizado</th>
              <th className="py-2 pr-3">Restante</th>
              <th className="py-2 pr-3">%</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const h = computeHealth(r.pct / 100, 1);
              return (
                <tr key={r.month} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-medium">{MONTHS[r.month]} {r.isManual && <Badge variant="outline" className="ml-2 text-[10px]">manual</Badge>}</td>
                  <td className="py-2 pr-3 tabular-nums">{formatBRL(r.meta)}</td>
                  <td className="py-2 pr-3 tabular-nums">{formatBRL(r.realized)}</td>
                  <td className="py-2 pr-3 tabular-nums">{formatBRL(r.remaining)}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.pct.toFixed(0)}%</td>
                  <td className="py-2 pr-3"><span className={h.colorClass}>● {h.label}</span></td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditMonth(r.month);
                        setEditValue(Number(r.meta).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {/* duplicate removed */}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>

      <Dialog open={editMonth !== null} onOpenChange={(o) => { if (!o) setEditMonth(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar meta de {editMonth !== null ? MONTHS[editMonth] : ''}</DialogTitle>
          </DialogHeader>
          <Input
            type="text"
            inputMode="decimal"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value.replace(/[^\d.,]/g, ''))}
            placeholder="Ex: 8.333,33"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMonth(null)}>Cancelar</Button>
            <Button onClick={() => {
              const raw = editValue.trim();
              // pt-BR aware: if both separators, "." is thousand and "," is decimal.
              // If only ",", it's decimal. If only ".", treat as decimal (en) unless used as thousand (3 digits after).
              let normalized = raw;
              if (raw.includes(',')) {
                normalized = raw.replace(/\./g, '').replace(',', '.');
              } else if ((raw.match(/\./g) || []).length > 1) {
                normalized = raw.replace(/\./g, '');
              }
              const v = Number(normalized);
              if (!isFinite(v) || v <= 0) { toast.error('Informe um valor válido'); return; }
              setPendingValue({ month: editMonth! + 1, value: v });
              setConfirmOpen(true);
              setEditMonth(null);
            }}>Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalcular meta anual?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta alteração deve recalcular a meta anual com a soma dos 12 meses?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={async () => {
              if (pendingValue) await plan.saveMonthly(pendingValue.month, pendingValue.value, false);
              toast.success('Meta do mês atualizada');
              setConfirmOpen(false); setPendingValue(null);
            }}>Não, manter</Button>
            <AlertDialogAction onClick={async () => {
              if (pendingValue) await plan.saveMonthly(pendingValue.month, pendingValue.value, true);
              toast.success('Metas atualizadas');
              setConfirmOpen(false); setPendingValue(null);
            }}>Sim, recalcular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Card>
  );
}


// ============================================================
// ProgressTab
// ============================================================
function ProgressTab({ year, month, plan, finances, clients }: any) {
  const monthGoalRow = plan.monthly.find((g: MonthlyGoalRow) => g.month === month + 1);
  const monthGoal = monthGoalRow?.value ?? (plan.annual ? plan.annual.goal_value / 12 : 0);

  const dim = daysInMonth(year, month);
  // daily accumulated
  const dailyData = Array.from({ length: dim }, (_, i) => {
    const day = i + 1;
    const accRealized = finances
      .filter((f: any) => {
        const d = new Date(f.date);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() <= day;
      })
      .reduce((a: number, f: any) => a + Number(f.value || 0), 0);
    const accMeta = (monthGoal / dim) * day;
    return { day: String(day).padStart(2, '0'), Meta: accMeta, Realizado: accRealized };
  });

  const monthlyData = Array.from({ length: 12 }, (_, m) => ({
    name: MONTH_SHORT[m],
    Meta: plan.monthly.find((g: MonthlyGoalRow) => g.month === m + 1)?.value ?? (plan.annual ? plan.annual.goal_value / 12 : 0),
    Realizado: getRealizedForMonth(finances, clients, year, m),
  }));

  const elapsed = daysElapsed(year, month);
  const realized = getRealizedForMonth(finances, clients, year, month);
  const ritmo = elapsed > 0 ? realized / elapsed : 0;
  const projection = ritmo * dim;
  const chance = monthGoal > 0 ? Math.min(100, Math.round((projection / monthGoal) * 100)) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Activity className="h-4 w-4" />} label="Ritmo atual/dia" value={formatBRL(ritmo)} />
        <StatCard icon={<Flag className="h-4 w-4" />} label="Necessário/dia" value={formatBRL(Math.max(0, (monthGoal - realized) / Math.max(1, dim - elapsed)))} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Projeção" value={formatBRL(projection)} />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Chance de atingir" value={`${chance}%`} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Acumulado diário — {MONTHS[month]}</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-foreground" /> Realizado</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-muted-foreground" /> Meta</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="progressArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatShortBRL(Number(v))} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => formatBRL(Number(v))}
                labelFormatter={(l) => `Dia ${l}`}
              />
              <Line type="monotone" dataKey="Meta" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="Realizado" stroke="hsl(var(--foreground))" strokeWidth={2.5} fill="url(#progressArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Comparativo mensal — {year}</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-foreground" /> Realizado</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-muted-foreground/40" /> Meta</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatShortBRL(Number(v))} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.5 }}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => formatBRL(Number(v))}
              />
              <Bar dataKey="Meta" fill="hsl(var(--muted-foreground) / 0.35)" radius={[6,6,0,0]} />
              <Bar dataKey="Realizado" fill="hsl(var(--foreground))" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}