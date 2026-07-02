import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CRMColumn, CRMCard } from '@/types';
import { toast } from 'sonner';

const DEFAULT_COLUMNS: { title: string; order: number }[] = [
  { title: 'Prospectar', order: 0 },
  { title: 'Em Contato', order: 1 },
  { title: 'Reunião Marcada', order: 2 },
  { title: 'Ganhou', order: 3 },
  { title: 'Perdeu', order: 4 },
];

export function useCRM() {
  const { user } = useAuth();
  const [crmColumns, setCrmColumnsState] = useState<CRMColumn[]>([]);
  const [crmCards, setCrmCardsState] = useState<CRMCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCRM = useCallback(async () => {
    if (!user) {
      setCrmColumnsState([]);
      setCrmCardsState([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('crm_columns')
        .select('*')
        .eq('user_id', user.id)
        .order('column_order', { ascending: true });

      if (columnsError) throw columnsError;

      // If no columns exist, create default columns
      if (!columnsData || columnsData.length === 0) {
        const columnsToInsert = DEFAULT_COLUMNS.map((col) => ({
          user_id: user.id,
          title: col.title,
          column_order: col.order,
        }));

        const { data: insertedCols, error: insertError } = await supabase
          .from('crm_columns')
          .insert(columnsToInsert)
          .select();

        if (insertError) throw insertError;

        const mappedInserted: CRMColumn[] = (insertedCols || []).map((c) => ({
          id: c.id,
          title: c.title,
          order: c.column_order,
        }));
        setCrmColumnsState(mappedInserted);
      } else {
        const mappedColumns: CRMColumn[] = columnsData.map((c) => ({
          id: c.id,
          title: c.title,
          order: c.column_order,
        }));
        setCrmColumnsState(mappedColumns);
      }

      // Fetch cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('crm_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('card_order', { ascending: true });

      if (cardsError) throw cardsError;

      const mappedCards: CRMCard[] = (cardsData || []).map((c) => ({
        id: c.id,
        clientName: c.client_name,
        description: c.description || '',
        email: c.email || '',
        phone: c.phone || '',
        serviceType: c.service_type || '',
        columnId: c.column_id,
        order: c.card_order,
        role: (c as any).role || '',
        company: (c as any).company || '',
        revenue: (c as any).revenue ?? null,
        city: (c as any).city || '',
        notes: (c as any).notes || '',
      }));

      setCrmCardsState(mappedCards);
    } catch (error) {
      console.error('Error fetching CRM data:', error);
      toast.error('Erro ao carregar dados do CRM');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCRM();
  }, [fetchCRM]);

  const setCrmColumns = useCallback(async (newColumns: CRMColumn[] | ((prev: CRMColumn[]) => CRMColumn[])) => {
    if (!user) return;

    const updatedColumns = typeof newColumns === 'function'
      ? newColumns(crmColumns)
      : newColumns;

    const addedColumns = updatedColumns.filter(
      (nc) => !crmColumns.find((c) => c.id === nc.id)
    );

    const deletedColumns = crmColumns.filter(
      (c) => !updatedColumns.find((nc) => nc.id === c.id)
    );

    const existingColumns = updatedColumns.filter((nc) =>
      crmColumns.find((c) => c.id === nc.id)
    );

    try {
      for (const column of addedColumns) {
        const { error } = await supabase.from('crm_columns').insert({
          id: column.id,
          user_id: user.id,
          title: column.title,
          column_order: column.order,
        });
        if (error) throw error;
      }

      for (const column of deletedColumns) {
        const { error } = await supabase
          .from('crm_columns')
          .delete()
          .eq('id', column.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }

      for (const column of existingColumns) {
        const original = crmColumns.find((c) => c.id === column.id);
        if (original && JSON.stringify(original) !== JSON.stringify(column)) {
          const { error } = await supabase
            .from('crm_columns')
            .update({
              title: column.title,
              column_order: column.order,
            })
            .eq('id', column.id)
            .eq('user_id', user.id);
          if (error) throw error;
        }
      }

      setCrmColumnsState(updatedColumns);
    } catch (error) {
      console.error('Error updating columns:', error);
      toast.error('Erro ao atualizar colunas');
      fetchCRM();
    }
  }, [user, crmColumns, fetchCRM]);

  const setCrmCards = useCallback(async (newCards: CRMCard[] | ((prev: CRMCard[]) => CRMCard[])) => {
    if (!user) return;

    const updatedCards = typeof newCards === 'function'
      ? newCards(crmCards)
      : newCards;

    // Optimistic update - set state immediately
    setCrmCardsState(updatedCards);

    const addedCards = updatedCards.filter(
      (nc) => !crmCards.find((c) => c.id === nc.id)
    );

    const deletedCards = crmCards.filter(
      (c) => !updatedCards.find((nc) => nc.id === c.id)
    );

    const existingCards = updatedCards.filter((nc) =>
      crmCards.find((c) => c.id === nc.id)
    );

    try {
      for (const card of addedCards) {
        const { error } = await supabase.from('crm_cards').insert({
          id: card.id,
          user_id: user.id,
          client_name: card.clientName,
          description: card.description,
          email: card.email,
          phone: card.phone,
          service_type: card.serviceType,
          column_id: card.columnId,
          card_order: card.order,
          role: card.role || null,
          company: card.company || null,
          revenue: card.revenue ?? null,
          city: card.city || null,
          notes: card.notes || null,
        });
        if (error) throw error;
      }

      for (const card of deletedCards) {
        const { error } = await supabase
          .from('crm_cards')
          .delete()
          .eq('id', card.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }

      for (const card of existingCards) {
        const original = crmCards.find((c) => c.id === card.id);
        if (original && JSON.stringify(original) !== JSON.stringify(card)) {
          const { error } = await supabase
            .from('crm_cards')
            .update({
              client_name: card.clientName,
              description: card.description,
              email: card.email,
              phone: card.phone,
              service_type: card.serviceType,
              column_id: card.columnId,
              card_order: card.order,
              role: card.role || null,
              company: card.company || null,
              revenue: card.revenue ?? null,
              city: card.city || null,
              notes: card.notes || null,
            })
            .eq('id', card.id)
            .eq('user_id', user.id);
          if (error) throw error;
        }
      }
    } catch (error) {
      console.error('Error updating cards:', error);
      toast.error('Erro ao atualizar cartões');
      fetchCRM();
    }
  }, [user, crmCards, fetchCRM]);

  return { crmColumns, setCrmColumns, crmCards, setCrmCards, loading, refetch: fetchCRM };
}
