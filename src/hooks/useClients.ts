import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types';
import { toast } from 'sonner';

export function useClients() {
  const { user } = useAuth();
  const [clients, setClientsState] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!user) {
      setClientsState([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedClients: Client[] = (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company || '',
        serviceType: c.service_type,
        recurrence: c.recurrence as 'mensal' | 'pontual',
        monthlyValue: Number(c.monthly_value),
        contractDay: c.contract_day,
        status: c.status as 'ativo' | 'inativo' | 'pendente',
        email: c.email || '',
        phone: c.phone || '',
        createdAt: new Date(c.created_at),
        entryDate: c.entry_date ? new Date(c.entry_date + 'T12:00:00Z') : new Date(c.created_at),
        deactivatedAt: c.deactivated_at ? new Date(c.deactivated_at + 'T12:00:00Z') : null,
      }));

      setClientsState(mappedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const setClients = useCallback(async (newClients: Client[] | ((prev: Client[]) => Client[])) => {
    if (!user) return;

    const updatedClients = typeof newClients === 'function' 
      ? newClients(clients) 
      : newClients;

    // Find added clients
    const addedClients = updatedClients.filter(
      (nc) => !clients.find((c) => c.id === nc.id)
    );

    // Find deleted clients
    const deletedClients = clients.filter(
      (c) => !updatedClients.find((nc) => nc.id === c.id)
    );

    // Find updated clients
    const existingClients = updatedClients.filter((nc) =>
      clients.find((c) => c.id === nc.id)
    );

    try {
      // Handle additions
      for (const client of addedClients) {
        const { error } = await supabase.from('clients').insert({
          id: client.id,
          user_id: user.id,
          name: client.name,
          company: client.company,
          service_type: client.serviceType,
          recurrence: client.recurrence,
          monthly_value: client.monthlyValue,
          contract_day: client.contractDay,
          status: client.status,
          email: client.email,
          phone: client.phone,
          entry_date: client.entryDate.toISOString().split('T')[0],
          deactivated_at: client.deactivatedAt ? client.deactivatedAt.toISOString().split('T')[0] : null,
        });
        if (error) throw error;
      }

      // Handle deletions
      for (const client of deletedClients) {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', client.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }

      // Handle updates
      for (const client of existingClients) {
        const original = clients.find((c) => c.id === client.id);
        if (original && JSON.stringify(original) !== JSON.stringify(client)) {
          const { error } = await supabase
            .from('clients')
            .update({
              name: client.name,
              company: client.company,
              service_type: client.serviceType,
              recurrence: client.recurrence,
              monthly_value: client.monthlyValue,
              contract_day: client.contractDay,
              status: client.status,
              email: client.email,
              phone: client.phone,
              entry_date: client.entryDate.toISOString().split('T')[0],
              deactivated_at: client.deactivatedAt ? client.deactivatedAt.toISOString().split('T')[0] : null,
            })
            .eq('id', client.id)
            .eq('user_id', user.id);
          if (error) throw error;
        }
      }

      setClientsState(updatedClients);
    } catch (error) {
      console.error('Error updating clients:', error);
      toast.error('Erro ao atualizar clientes');
      fetchClients(); // Revert to server state
    }
  }, [user, clients, fetchClients]);

  return { clients, setClients, loading, refetch: fetchClients };
}
