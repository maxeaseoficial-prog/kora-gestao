import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Target, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { getRecurringRevenueForMonth } from '@/lib/revenue';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Faturamento() {
  const { user } = useAuth();
  const { finances, clients, hideNumbers } = useApp();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    finances.forEach((f) => years.add(new Date(f.date).getFullYear()));
    clients.forEach((c) => {
      if (c.entryDate) years.add(new Date(c.entryDate).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [finances, clients, currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [goalValue, setGoalValue] = useState<string>('');
  const [goalId, setGoalId] = useState<string | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);

  // Load goal for selected year
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('annual_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .maybeSingle();
      if (error) {
        console.error(error);
        return;
      }
      if (data) {
        setGoalId(data.id);
        setGoalValue(String(data.goal_value));
      } else {
        setGoalId(null);
        setGoalValue('');
      }
    })();
  }, [user, selectedYear]);

  const saveGoal = async () => {
    if (!user) return;
    const num = parseFloat(goalValue) || 0;
    setSavingGoal(true);
    try {
      if (goalId) {
        const { error } = await supabase
          .from('annual_goals')
          .update({ goal_value: num })
          .eq('id', goalId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('annual_goals')
          .insert({ user_id: user.id, year: selectedYear, goal_value: num })
          .select()
          .single();
        if (error) throw error;
        setGoalId(data.id);
      }
      toast.success('Meta salva');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar meta');
    } finally {
      setSavingGoal(false);
    }
  };

  // Compute monthly revenue: sum finance entries in month + active client recurrence
  const monthlyData = useMemo(() => {
    const data = MONTHS.map((name, idx) => {
      const monthStart = new Date(selectedYear, idx, 1);
      const monthEnd = new Date(selectedYear, idx + 1, 0, 23, 59, 59);

      // Sum finance entries in this month
      const cashRevenue = finances
        .filter((f) => {
          const d = new Date(f.date);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((s, f) => s + Number(f.value), 0);

      const recurrenceRevenue = getRecurringRevenueForMonth(clients, selectedYear, idx);

      return {
        idx,
        name,
        cashRevenue,
        recurrenceRevenue,
        total: cashRevenue + recurrenceRevenue,
      };
    });
    return data;
  }, [finances, clients, selectedYear]);

  const goalNum = parseFloat(goalValue) || 0;
  const baseMonthly = goalNum / 12;

  // Distribute monthly goals: past months that under-performed accumulate
  // to remaining months equally (only meaningful for current year).
  const monthlyGoals = useMemo(() => {
    const goals = Array(12).fill(baseMonthly);
    if (goalNum <= 0) return goals;

    const isCurrentYear = selectedYear === currentYear;
    const lastClosedMonth = isCurrentYear ? currentMonth - 1 : 11; // months [0..lastClosed] are closed

    if (lastClosedMonth < 0) return goals;

    let shortfall = 0;
    for (let i = 0; i <= lastClosedMonth; i++) {
      const diff = baseMonthly - monthlyData[i].total;
      if (diff > 0) shortfall += diff;
    }

    const remainingMonths = 11 - lastClosedMonth; // months after lastClosed
    if (remainingMonths > 0 && shortfall > 0) {
      const extra = shortfall / remainingMonths;
      for (let i = lastClosedMonth + 1; i < 12; i++) {
        goals[i] = baseMonthly + extra;
      }
    }
    return goals;
  }, [baseMonthly, goalNum, monthlyData, selectedYear, currentYear, currentMonth]);

  const totalRevenue = monthlyData.reduce((s, m) => s + m.total, 0);
  const progress = goalNum > 0 ? Math.min(100, (totalRevenue / goalNum) * 100) : 0;
  const remaining = Math.max(0, goalNum - totalRevenue);

  const display = (v: number) => (hideNumbers ? 'R$ ••••' : formatBRL(v));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Faturamento e Metas</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o faturamento anual e o progresso da meta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
              {!availableYears.includes(currentYear + 1) && (
                <SelectItem value={String(currentYear + 1)}>{currentYear + 1}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Goal card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" /> Meta anual de {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <Label htmlFor="goal">Valor da meta (R$)</Label>
              <Input
                id="goal"
                type="number"
                step="0.01"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <Button onClick={saveGoal} disabled={savingGoal}>
              {savingGoal ? 'Salvando...' : 'Salvar meta'}
            </Button>
          </div>

          {goalNum > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso anual</span>
                <span className="font-medium">
                  {display(totalRevenue)} / {display(goalNum)}
                </span>
              </div>
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress.toFixed(1)}% atingido</span>
                <span>Falta {display(remaining)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{display(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meta mensal base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{display(baseMonthly)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faltando p/ meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{display(remaining)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {monthlyData.map((m) => {
              const monthGoal = monthlyGoals[m.idx];
              const monthProgress = monthGoal > 0
                ? Math.min(100, (m.total / monthGoal) * 100)
                : 0;
              const isPast = selectedYear < currentYear ||
                (selectedYear === currentYear && m.idx < currentMonth);
              const isCurrent = selectedYear === currentYear && m.idx === currentMonth;
              const hit = monthGoal > 0 && m.total >= monthGoal;
              return (
                <div
                  key={m.idx}
                  className={`p-4 rounded-lg border ${
                    isCurrent ? 'border-foreground/40 bg-accent/30' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{m.name}</span>
                    {monthGoal > 0 && isPast && (
                      hit ? (
                        <TrendingUp className="h-4 w-4 text-foreground" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Caixa</span>
                      <span>{display(m.cashRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recorrência</span>
                      <span>{display(m.recurrenceRevenue)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-border mt-1">
                      <span>Total</span>
                      <span>{display(m.total)}</span>
                    </div>
                    {monthGoal > 0 && (
                      <>
                        <div className="flex justify-between text-xs text-muted-foreground pt-2">
                          <span>Meta do mês</span>
                          <span>{display(monthGoal)}</span>
                        </div>
                        <Progress value={monthProgress} className="h-1.5" />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}