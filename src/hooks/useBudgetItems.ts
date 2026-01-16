import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BudgetItem {
  id: string;
  name: string;
  price: number;
  productLink?: string;
  imageUrl?: string;
  createdAt: Date;
}

export function useBudgetItems() {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBudgetItems();
    } else {
      setBudgetItems([]);
      setLoading(false);
    }
  }, [user]);

  const fetchBudgetItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: BudgetItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        productLink: item.product_link || undefined,
        imageUrl: item.image_url || undefined,
        createdAt: new Date(item.created_at),
      }));

      setBudgetItems(items);
    } catch (error) {
      console.error('Error fetching budget items:', error);
      toast.error('Erro ao carregar itens do orçamento');
    } finally {
      setLoading(false);
    }
  };

  const addBudgetItem = async (item: Omit<BudgetItem, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budget_items')
        .insert({
          user_id: user.id,
          name: item.name,
          price: item.price,
          product_link: item.productLink || null,
          image_url: item.imageUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: BudgetItem = {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        productLink: data.product_link || undefined,
        imageUrl: data.image_url || undefined,
        createdAt: new Date(data.created_at),
      };

      setBudgetItems(prev => [newItem, ...prev]);
      toast.success('Produto adicionado ao orçamento');
    } catch (error) {
      console.error('Error adding budget item:', error);
      toast.error('Erro ao adicionar produto');
    }
  };

  const updateBudgetItem = async (id: string, item: Omit<BudgetItem, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('budget_items')
        .update({
          name: item.name,
          price: item.price,
          product_link: item.productLink || null,
          image_url: item.imageUrl || null,
        })
        .eq('id', id);

      if (error) throw error;

      setBudgetItems(prev =>
        prev.map(existing =>
          existing.id === id
            ? { ...existing, ...item }
            : existing
        )
      );
      toast.success('Produto atualizado');
    } catch (error) {
      console.error('Error updating budget item:', error);
      toast.error('Erro ao atualizar produto');
    }
  };

  const deleteBudgetItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBudgetItems(prev => prev.filter(item => item.id !== id));
      toast.success('Produto removido do orçamento');
    } catch (error) {
      console.error('Error deleting budget item:', error);
      toast.error('Erro ao remover produto');
    }
  };

  const totalBalance = budgetItems.reduce((sum, item) => sum + item.price, 0);

  return {
    budgetItems,
    loading,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    totalBalance,
  };
}
