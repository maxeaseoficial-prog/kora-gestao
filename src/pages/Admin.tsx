import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Settings, LogOut, ShieldCheck, CreditCard, Save } from 'lucide-react';

export default function Admin() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminData, setAdminData] = useState<any>(null);
  
  // Tabs data
  const [users, setUsers] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState({ siteName: '' });
  const [newAdminPass, setNewAdminPass] = useState('');
  const [loading, setLoading] = useState(false);

  const checkAuth = async () => {
    const { data } = await supabase.from('admin_settings').select('*').maybeSingle();
    setAdminData(data);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminData) return;
    
    if (loginUsername === adminData.admin_username && loginPassword === adminData.admin_password_hash) {
      setIsAdminAuthenticated(true);
      fetchUsers();
      setSiteConfig({ siteName: adminData.site_name });
      toast.success('Acesso administrativo concedido');
    } else {
      toast.error('Credenciais inválidas');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    // Note: admin_user_view requires the role that queries it to have access.
    // In Lovable Cloud, the frontend queries as 'authenticated'.
    const { data, error } = await supabase.from('admin_user_view').select('*');
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  const updatePlan = async (userId: string, planType: string) => {
    try {
      if (planType === 'none') {
        await supabase.from('user_plan_overrides').delete().eq('user_id', userId);
      } else {
        await supabase.from('user_plan_overrides').upsert({
          user_id: userId,
          plan_type: planType,
          expires_at: planType === 'lifetime' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      toast.success('Plano atualizado com sucesso');
      fetchUsers();
    } catch (err) {
      toast.error('Erro ao atualizar plano');
    }
  };

  const saveSettings = async () => {
    try {
      const updates: any = { site_name: siteConfig.siteName };
      if (newAdminPass) updates.admin_password_hash = newAdminPass;
      
      const { error } = await supabase
        .from('admin_settings')
        .update(updates)
        .eq('id', adminData.id);
        
      if (error) throw error;
      toast.success('Configurações salvas');
      setNewAdminPass('');
      checkAuth();
    } catch (err) {
      toast.error('Erro ao salvar configurações');
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
        <Card className="w-full max-w-md bg-[#141414] border-white/5">
          <CardHeader className="text-center">
            <div className="mx-auto bg-white/5 p-3 rounded-full w-fit mb-4">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Acesso Administrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/60">Usuário</Label>
                <Input 
                  value={loginUsername} 
                  onChange={e => setLoginUsername(e.target.value)}
                  className="bg-white/5 border-white/10 text-white" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Senha</Label>
                <Input 
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white" 
                />
              </div>
              <Button type="submit" className="w-full bg-white text-black hover:bg-white/90">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Painel Admin</h1>
          </div>
          <Button variant="ghost" onClick={() => setIsAdminAuthenticated(false)} className="text-white/60">
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
                    {users.map((u) => (
                      <TableRow key={u.id} className="border-white/5">
                        <TableCell className="text-white">{u.email}</TableCell>
                        <TableCell className="text-white/60">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className="text-white px-2 py-1 bg-white/5 rounded text-xs uppercase">
                            {u.override_plan || 'Nenhum'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select 
                            onValueChange={(val) => updatePlan(u.id, val)}
                            defaultValue={u.override_plan || 'none'}
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
                  <div className="space-y-2">
                    <Label className="text-white/60">Nova Senha Admin</Label>
                    <Input 
                      type="password"
                      value={newAdminPass} 
                      onChange={e => setNewAdminPass(e.target.value)}
                      className="bg-white/5 border-white/10 text-white" 
                      placeholder="Deixe em branco para não mudar"
                    />
                  </div>
                  <Button onClick={saveSettings} className="bg-white text-black hover:bg-white/90">
                    <Save className="h-4 w-4 mr-2" /> Atualizar Senha
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
