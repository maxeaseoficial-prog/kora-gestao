import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FinanceEntry } from '@/types';
import { toast } from 'sonner';

export function useFinances() {
  const { user } = useAuth();
  const [finances, setFinancesState] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFinances = useCallback(async () => {
    if (!user) {
      setFinancesState([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('finance_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      const mappedFinances: FinanceEntry[] = (data || []).map((f) => {
        // Parse date as local time to avoid timezone issues
        const dateStr = f.entry_date;
        const [year, month, day] = dateStr.split('-').map(Number);
        
        return {
          id: f.id,
          clientId: f.client_id || '',
          clientName: f.client_name,
          value: Number(f.value),
          date: new Date(year, month - 1, day, 12, 0, 0),
          type: f.entry_type,
          description: f.description || '',
        };
      });

      setFinancesState(mappedFinances);
    } catch (error) {
      console.error('Error fetching finances:', error);
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  const setFinances = useCallback(async (newFinances: FinanceEntry[] | ((prev: FinanceEntry[]) => FinanceEntry[])) => {
    if (!user) return;

    const updatedFinances = typeof newFinances === 'function'
      ? newFinances(finances)
      : newFinances;

    const addedFinances = updatedFinances.filter(
      (nf) => !finances.find((f) => f.id === nf.id)
    );

    const deletedFinances = finances.filter(
      (f) => !updatedFinances.find((nf) => nf.id === f.id)
    );

    const existingFinances = updatedFinances.filter((nf) =>
      finances.find((f) => f.id === nf.id)
    );

    try {
      for (const finance of addedFinances) {
        const dateObj = new Date(finance.date);
        const entryDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        
        const { error } = await supabase.from('finance_entries').insert({
          id: finance.id,
          user_id: user.id,
          client_id: finance.clientId || null,
          client_name: finance.clientName,
          value: finance.value,
          entry_date: entryDate,
          entry_type: finance.type,
          description: finance.description,
        });
        if (error) throw error;
      }

      for (const finance of deletedFinances) {
        const { error } = await supabase
          .from('finance_entries')
          .delete()
          .eq('id', finance.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }

      for (const finance of existingFinances) {
        const original = finances.find((f) => f.id === finance.id);
        if (original && JSON.stringify(original) !== JSON.stringify(finance)) {
          const dateObj = new Date(finance.date);
          const entryDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
          
          const { error } = await supabase
            .from('finance_entries')
            .update({
              client_id: finance.clientId || null,
              client_name: finance.clientName,
              value: finance.value,
              entry_date: entryDate,
              entry_type: finance.type,
              description: finance.description,
            })
            .eq('id', finance.id)
            .eq('user_id', user.id);
          if (error) throw error;
        }
      }

      setFinancesState(updatedFinances);
    } catch (error) {
      console.error('Error updating finances:', error);
      toast.error('Erro ao atualizar lançamentos');
      fetchFinances();
    }
  }, [user, finances, fetchFinances]);

  return { finances, setFinances, loading, refetch: fetchFinances };
}
