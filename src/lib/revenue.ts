import { Client } from '@/types';

const getMonthKey = (date?: Date | string | null) => {
  if (!date) return null;

  if (typeof date === 'string') {
    const [year, month] = date.slice(0, 10).split('-').map(Number);
    return Number.isFinite(year) && Number.isFinite(month) ? year * 12 + (month - 1) : null;
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.getFullYear() * 12 + parsed.getMonth();
};

export const isClientActiveInMonth = (client: Client, year: number, month: number) => {
  if (client.status === 'pendente') return false;
  // Inactive client without a deactivation date: not counted anywhere.
  if (client.status === 'inativo' && !client.deactivatedAt) return false;

  const selectedMonthKey = year * 12 + month;
  const entryMonthKey = getMonthKey(client.entryDate || client.createdAt);
  const deactivatedMonthKey = getMonthKey(client.deactivatedAt);

  if (entryMonthKey !== null && entryMonthKey > selectedMonthKey) return false;
  if (deactivatedMonthKey !== null && deactivatedMonthKey < selectedMonthKey) return false;

  return true;
};

export const getRecurringRevenueForMonth = (clients: Client[], year: number, month: number) => {
  return clients
    .filter((client) => client.recurrence === 'mensal' && isClientActiveInMonth(client, year, month))
    .reduce((total, client) => total + Number(client.monthlyValue || 0), 0);
};