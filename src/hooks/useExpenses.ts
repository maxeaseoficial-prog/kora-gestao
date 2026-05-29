import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ExpenseCategory = 'Pagamento' | 'Investimento' | 'Fornecedor' | 'Outros';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  value: number;
  entryDate: string; // yyyy-mm-dd
  paymentDate: string | null;
  receiptUrl: string | null;
  createdAt: string;
}

export interface ExpenseInput {
  category: ExpenseCategory;
  description: string;
  value: number;
  entryDate: string;
  paymentDate: string | null;
  receiptUrl: string | null;
}

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });
      if (error) throw error;
      setExpenses(
        (data || []).map((e: any) => ({
          id: e.id,
          category: e.category,
          description: e.description || '',
          value: Number(e.value),
          entryDate: e.entry_date,
          paymentDate: e.payment_date,
          receiptUrl: e.receipt_url,
          createdAt: e.created_at,
        })),
      );
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar saídas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = async (input: ExpenseInput) => {
    if (!user) return;
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      category: input.category,
      description: input.description,
      value: input.value,
      entry_date: input.entryDate,
      payment_date: input.paymentDate,
      receipt_url: input.receiptUrl,
    });
    if (error) {
      toast.error('Erro ao criar saída');
      return;
    }
    toast.success('Saída cadastrada');
    fetchExpenses();
  };

  const updateExpense = async (id: string, input: ExpenseInput) => {
    if (!user) return;
    const { error } = await supabase
      .from('expenses')
      .update({
        category: input.category,
        description: input.description,
        value: input.value,
        entry_date: input.entryDate,
        payment_date: input.paymentDate,
        receipt_url: input.receiptUrl,
      })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Erro ao atualizar saída');
      return;
    }
    toast.success('Saída atualizada');
    fetchExpenses();
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast.error('Erro ao excluir saída');
      return;
    }
    toast.success('Saída excluída');
    fetchExpenses();
  };

  return { expenses, loading, createExpense, updateExpense, deleteExpense, refetch: fetchExpenses };
}