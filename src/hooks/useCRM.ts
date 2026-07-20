import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CRMColumn, CRMCard } from '@/types';
import { toast } from 'sonner';

const DEFAULT_COLUMNS: { title: string; order: number }[] = [
  { title: 'Prospectar', order: 0 },
  { title: 'Em Contato', order: 1 },
  { title: 'Reunião Marcada', order: 2 },
  { title: 'Em Negociação', order: 3 },
  { title: 'Ganhou', order: 4 },
  { title: 'Perdeu', order: 5 },
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
          color: (c as any).color || undefined,
        }));
        setCrmColumnsState(mappedInserted);
      } else {
        const mappedColumns: CRMColumn[] = columnsData.map((c) => ({
          id: c.id,
          title: c.title,
          order: c.column_order,
          color: (c as any).color || undefined,
        }));

        // Backfill: ensure "Em Negociação" exists between "Reunião Marcada" and "Ganhou"
        const hasNegociacao = mappedColumns.some((c) =>
          c.title.trim().toLowerCase().includes('negocia')
        );
        if (!hasNegociacao) {
          const reuniao = mappedColumns.find((c) =>
            c.title.trim().toLowerCase().includes('reuni')
          );
          const insertOrder = reuniao ? reuniao.order + 1 : mappedColumns.length;

          // Shift orders of columns at or after insertOrder
          const toShift = mappedColumns.filter((c) => c.order >= insertOrder);
          for (const col of toShift) {
            await supabase
              .from('crm_columns')
              .update({ column_order: col.order + 1 })
              .eq('id', col.id)
              .eq('user_id', user.id);
          }

          const { data: inserted, error: insertNegErr } = await supabase
            .from('crm_columns')
            .insert({
              user_id: user.id,
              title: 'Em Negociação',
              column_order: insertOrder,
              color: 'orange',
            } as any)
            .select()
            .single();

          if (!insertNegErr && inserted) {
            const updated = mappedColumns.map((c) =>
              c.order >= insertOrder ? { ...c, order: c.order + 1 } : c
            );
            updated.push({
              id: (inserted as any).id,
              title: (inserted as any).title,
              order: (inserted as any).column_order,
              color: (inserted as any).color || 'orange',
            });
            updated.sort((a, b) => a.order - b.order);
            setCrmColumnsState(updated);
          } else {
            setCrmColumnsState(mappedColumns);
          }
        } else {
          setCrmColumnsState(mappedColumns);
        }

        // Backfill: ensure "Ganhou" is second-to-last and "Perdeu" is last
        setCrmColumnsState((prev) => {
          const cols = prev.length ? [...prev] : [...mappedColumns];
          const ganhou = cols.find((c) => c.title.trim().toLowerCase() === 'ganhou');
          const perdeu = cols.find((c) => c.title.trim().toLowerCase() === 'perdeu');
          if (!ganhou || !perdeu) return cols;

          const others = cols
            .filter((c) => c.id !== ganhou.id && c.id !== perdeu.id)
            .sort((a, b) => a.order - b.order);
          const desired = [...others, ganhou, perdeu];
          const needsUpdate = desired.some((c, i) => c.order !== i);
          if (!needsUpdate) return cols;

          const updated = desired.map((c, i) => ({ ...c, order: i }));
          (async () => {
            for (const c of updated) {
              const original = cols.find((o) => o.id === c.id);
              if (original && original.order !== c.order) {
                await supabase
                  .from('crm_columns')
                  .update({ column_order: c.order })
                  .eq('id', c.id)
                  .eq('user_id', user.id);
              }
            }
          })();
          return updated;
        });
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
          color: column.color || null,
        } as any);
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
              color: column.color || null,
            } as any)
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
