import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ObjectiveRow } from '@/lib/planning';

export interface MonthlyGoalRow {
  id: string;
  year: number;
  month: number; // 1..12
  value: number;
  is_manual: boolean;
}

export interface AnnualGoalRow {
  id: string;
  year: number;
  goal_value: number;
  description?: string | null;
}

export interface HistoryRow {
  id: string;
  event_type: string;
  description: string;
  metadata: any;
  created_at: string;
}

const db = supabase as any;

export function usePlanning(year: number) {
  const { user } = useAuth();
  const [annual, setAnnual] = useState<AnnualGoalRow | null>(null);
  const [monthly, setMonthly] = useState<MonthlyGoalRow[]>([]);
  const [objectives, setObjectives] = useState<ObjectiveRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [a, m, o, h] = await Promise.all([
      db.from('annual_goals').select('*').eq('user_id', user.id).eq('year', year).maybeSingle(),
      db.from('monthly_goals').select('*').eq('user_id', user.id).eq('year', year),
      db.from('planning_objectives').select('*').eq('user_id', user.id).eq('year', year),
      db.from('planning_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
    ]);
    setAnnual(a.data ? { ...a.data, goal_value: Number(a.data.goal_value) } : null);
    setMonthly((m.data || []).map((r: any) => ({ ...r, value: Number(r.value) })));
    setObjectives((o.data || []).map((r: any) => ({
      ...r,
      target_value: Number(r.target_value || 0),
      target_quantity: r.target_quantity != null ? Number(r.target_quantity) : null,
      unit_price_snapshot: r.unit_price_snapshot != null ? Number(r.unit_price_snapshot) : null,
    })));
    setHistory(h.data || []);
    setLoading(false);
  }, [user, year]);

  useEffect(() => { reload(); }, [reload]);

  const logEvent = useCallback(async (event_type: string, description: string, metadata: any = {}) => {
    if (!user) return;
    await db.from('planning_history').insert({ user_id: user.id, event_type, description, metadata });
  }, [user]);

  const saveAnnual = useCallback(async (goal_value: number, description?: string) => {
    if (!user) return;
    const payload: any = { user_id: user.id, year, goal_value, description };
    if (annual?.id) {
      await db.from('annual_goals').update(payload).eq('id', annual.id);
    } else {
      await db.from('annual_goals').insert(payload);
    }
    // Auto-distribute across months that are NOT manual
    const perMonth = goal_value / 12;
    const manualMap = new Map(monthly.filter(m => m.is_manual).map(m => [m.month, m]));
    const upserts = [] as any[];
    for (let mo = 1; mo <= 12; mo++) {
      if (manualMap.has(mo)) continue;
      upserts.push({ user_id: user.id, year, month: mo, value: perMonth, is_manual: false });
    }
    if (upserts.length) {
      await db.from('monthly_goals').upsert(upserts, { onConflict: 'user_id,year,month' });
    }
    await logEvent('annual_goal_saved', `Meta anual ${year} definida em ${goal_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    await reload();
  }, [user, year, annual, monthly, reload, logEvent]);

  const saveMonthly = useCallback(async (month: number, value: number, recalcAnnual: boolean) => {
    if (!user) return;
    await db.from('monthly_goals').upsert(
      { user_id: user.id, year, month, value, is_manual: true },
      { onConflict: 'user_id,year,month' }
    );
    if (recalcAnnual) {
      // After upsert, sum all months to derive annual
      const { data } = await db.from('monthly_goals').select('value').eq('user_id', user.id).eq('year', year);
      const total = (data || []).reduce((a: number, r: any) => a + Number(r.value || 0), 0);
      if (annual?.id) await db.from('annual_goals').update({ goal_value: total }).eq('id', annual.id);
      else await db.from('annual_goals').insert({ user_id: user.id, year, goal_value: total });
    }
    await logEvent('monthly_goal_saved', `Meta de ${String(month).padStart(2,'0')}/${year} atualizada para ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    await reload();
  }, [user, year, annual, reload, logEvent]);

  const saveObjective = useCallback(async (obj: Partial<ObjectiveRow> & { id?: string }) => {
    if (!user) return;
    const payload: any = { user_id: user.id, ...obj };
    if (obj.id) {
      await db.from('planning_objectives').update(payload).eq('id', obj.id);
      await logEvent('objective_updated', `Objetivo "${obj.name}" atualizado`);
    } else {
      await db.from('planning_objectives').insert(payload);
      await logEvent('objective_created', `Objetivo "${obj.name}" criado para ${String(obj.month).padStart(2,'0')}/${obj.year}`);
    }
    await reload();
  }, [user, reload, logEvent]);

  const deleteObjective = useCallback(async (id: string, name: string) => {
    await db.from('planning_objectives').delete().eq('id', id);
    await logEvent('objective_deleted', `Objetivo "${name}" removido`);
    await reload();
  }, [reload, logEvent]);

  const duplicateMonthPlan = useCallback(async (fromMonth: number, toMonth: number, toYear: number = year) => {
    if (!user) return;
    const src = objectives.filter(o => o.month === fromMonth);
    if (!src.length) return;
    const payload = src.map(o => ({
      user_id: user.id,
      year: toYear,
      month: toMonth,
      type: o.type,
      name: o.name,
      product_id: o.product_id,
      service_id: o.service_id,
      client_id: o.client_id,
      target_value: o.target_value,
      target_quantity: o.target_quantity,
      unit_price_snapshot: o.unit_price_snapshot,
    }));
    await db.from('planning_objectives').insert(payload);
    await logEvent('plan_duplicated', `Planejamento de ${String(fromMonth).padStart(2,'0')}/${year} duplicado para ${String(toMonth).padStart(2,'0')}/${toYear}`);
    await reload();
  }, [user, year, objectives, reload, logEvent]);

  return {
    loading, annual, monthly, objectives, history,
    saveAnnual, saveMonthly, saveObjective, deleteObjective, duplicateMonthPlan, reload, logEvent,
  };
}