import type { Client, FinanceEntry } from '@/types';
import { getRecurringRevenueForMonth, isClientActiveInMonth } from '@/lib/revenue';

export type GoalHealth = 'excellent' | 'on-track' | 'attention' | 'critical';

export interface HealthInfo {
  level: GoalHealth;
  label: string;
  colorClass: string; // tailwind text color (neutral palette)
  dotClass: string;
}

export function computeHealth(percentRealized: number, percentOfMonth: number): HealthInfo {
  // Both values 0..1
  if (percentOfMonth <= 0) {
    return { level: 'on-track', label: 'No ritmo', colorClass: 'text-foreground', dotClass: 'bg-foreground' };
  }
  const ratio = percentRealized / percentOfMonth;
  if (ratio >= 1) return { level: 'excellent', label: 'Excelente', colorClass: 'text-emerald-400', dotClass: 'bg-emerald-400' };
  if (ratio >= 0.85) return { level: 'on-track', label: 'No ritmo', colorClass: 'text-sky-400', dotClass: 'bg-sky-400' };
  if (ratio >= 0.6) return { level: 'attention', label: 'Atenção', colorClass: 'text-amber-400', dotClass: 'bg-amber-400' };
  return { level: 'critical', label: 'Crítico', colorClass: 'text-rose-400', dotClass: 'bg-rose-400' };
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function daysElapsed(year: number, month: number, today = new Date()) {
  const t = today;
  if (t.getFullYear() < year || (t.getFullYear() === year && t.getMonth() < month)) return 0;
  if (t.getFullYear() > year || (t.getFullYear() === year && t.getMonth() > month)) return daysInMonth(year, month);
  return t.getDate();
}

export interface ObjectiveRow {
  id: string;
  year: number;
  month: number;
  type: 'produto' | 'servico' | 'contrato' | 'outro';
  name: string;
  product_id?: string | null;
  service_id?: string | null;
  client_id?: string | null;
  target_value: number;
  target_quantity?: number | null;
  unit_price_snapshot?: number | null;
}

export function getRealizedForMonth(
  finances: FinanceEntry[],
  clients: Client[],
  year: number,
  month: number,
) {
  const incomes = finances
    .filter((f) => {
      const d = new Date(f.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((acc, f) => acc + f.value, 0);
  const recurring = getRecurringRevenueForMonth(clients, year, month);
  return incomes + recurring;
}

// Match a finance entry to an objective.
// Uses ids first when available, falls back to name matching in description / type / client_name.
export function entryMatchesObjective(entry: any, obj: ObjectiveRow): boolean {
  if (obj.type === 'produto') {
    if (entry.product_id && obj.product_id) return entry.product_id === obj.product_id;
  } else if (obj.type === 'servico') {
    if (entry.service_id && obj.service_id) return entry.service_id === obj.service_id;
  } else if (obj.type === 'contrato') {
    if (entry.client_id && obj.client_id) return String(entry.client_id) === String(obj.client_id);
  }
  // name fallback
  const needle = (obj.name || '').toLowerCase().trim();
  if (!needle) return false;
  const hay = `${entry.type || ''} ${entry.description || ''} ${entry.clientName || entry.client_name || ''}`.toLowerCase();
  return hay.includes(needle);
}

export function objectiveRealized(
  obj: ObjectiveRow,
  finances: FinanceEntry[],
  clients: Client[],
) {
  // Filter by month
  const monthEntries = finances.filter((f) => {
    const d = new Date(f.date);
    return d.getFullYear() === obj.year && d.getMonth() === obj.month;
  });
  let value = 0;
  let quantity = 0;
  for (const e of monthEntries) {
    if (entryMatchesObjective(e as any, obj)) {
      value += Number(e.value || 0);
      const q = Number((e as any).quantity);
      if (!Number.isNaN(q) && q > 0) quantity += q;
      else if (obj.unit_price_snapshot && obj.unit_price_snapshot > 0) {
        quantity += Number(e.value || 0) / obj.unit_price_snapshot;
      } else {
        quantity += 1;
      }
    }
  }
  if (obj.type === 'contrato' && obj.client_id) {
    // Count active recurring contracts of this client in the month
    const c = clients.find((c) => c.id === obj.client_id);
    if (c && isClientActiveInMonth(c, obj.year, obj.month)) {
      value += Number(c.monthlyValue || 0);
      quantity += 1;
    }
  }
  return { value, quantity };
}

export function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatShortBRL(v: number) {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(1).replace('.', ',')}k`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}