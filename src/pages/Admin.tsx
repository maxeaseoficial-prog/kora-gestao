import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Settings, LogOut, ShieldCheck, Save } from 'lucide-react';

type AdminUser = Database['public']['Functions']['admin_get_users']['Returns'][number];
type PlanSelection = 'none' | 'lifetime' | 'annual' | 'monthly';

export default function Admin() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, PlanSelection>>({});
  const [siteConfig, setSiteConfig] = useState({ siteName: '' });
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_get_users');

    if (error) {
      toast.error('Erro ao carregar usuários');
      setLoading(false);
      return;
    }

    const nextUsers = data ?? [];
    setUsers(nextUsers);
    setSelectedPlans(
      Object.fromEntries(
        nextUsers.map((user) => [
          user.id,
          (user.override_plan as PlanSelection | null) ?? 'none',
        ]),
      ),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchUsers();
    void supabase.rpc('admin_get_site_name').then(({ data, error }) => {
      if (error) {
        toast.error('Erro ao carregar configurações');
        return;
      }
      setSiteConfig({ siteName: data ?? '' });
    });
  }, [fetchUsers]);

  const updatePlan = async (userId: string) => {
    const planType = selectedPlans[userId];
    try {
      const expiresAt = planType === 'none' || planType === 'lifetime'
        ? null
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.rpc('admin_set_user_plan', {
        p_user_id: userId,
        p_plan_type: planType === 'none' ? null : planType,
        p_expires_at: expiresAt,
      });

      if (error) throw error;

      toast.success('Plano atualizado com sucesso');
      await fetchUsers();
    } catch {
      toast.error('Erro ao atualizar plano');
    }
  };

  const saveSettings = async () => {
    try {
      const { error } = await supabase.rpc('admin_update_site_name', {
        p_site_name: siteConfig.siteName,
      });
      if (error) throw error;
      toast.success('Configurações salvas');
    } catch {
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Painel Admin</h1>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="text-white/60">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-[#141414] border border-white/5 p-1">
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" /> Usuários</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" /> Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-[#141414] border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Gerenciar Usuários e Planos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5">
                      <TableHead className="text-white/60">Email</TableHead>
                      <TableHead className="text-white/60">Cadastro</TableHead>
                      <TableHead className="text-white/60">Plano Atual</TableHead>
                      <TableHead className="text-white/60">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow className="border-white/5">
                        <TableCell colSpan={4} className="text-center text-white/60">
                          Carregando usuários...
                        </TableCell>
                      </TableRow>
                    )}
                    {users.map((u) => (
                      <TableRow key={u.id} className="border-white/5">
                        <TableCell className="text-white">{u.email}</TableCell>
                        <TableCell className="text-white/60">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className="text-white px-2 py-1 bg-white/5 rounded text-xs uppercase">
                            {u.override_plan || 'Nenhum'}
                          </span>
                        </TableCell>
                        <TableCell className="flex items-center gap-2">
                          <Select 
                            onValueChange={(value) => setSelectedPlans((previous) => ({
                              ...previous,
                              [u.id]: value as PlanSelection,
                            }))}
                            value={selectedPlans[u.id] || 'none'}
                          >
                            <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Mudar plano" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141414] border-white/10 text-white">
                              <SelectItem value="none">Remover</SelectItem>
                              <SelectItem value="lifetime">Vitalício</SelectItem>
                              <SelectItem value="annual">Anual</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 px-3 border-white/10 hover:bg-white hover:text-black"
                            onClick={() => updatePlan(u.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#141414] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" /> Geral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/60">Nome do Sistema</Label>
                    <Input 
                      value={siteConfig.siteName} 
                      onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})}
                      className="bg-white/5 border-white/10 text-white" 
                    />
                  </div>
                  <Button onClick={saveSettings} className="bg-white text-black hover:bg-white/90">
                    <Save className="h-4 w-4 mr-2" /> Salvar Nome
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#141414] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" /> Acesso Admin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-white/60">
                    O acesso usa a conta autenticada no Supabase e uma permissão administrativa
                    gerenciada exclusivamente no banco de dados.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
