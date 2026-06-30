import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  User as UserIcon,
  Palette,
  Shield,
  CreditCard,
  LifeBuoy,
  Sun,
  Moon,
  HelpCircle,
  Bug,
  Sparkles,
  Info,
  Upload,
} from 'lucide-react';

const PROFILE_KEY = 'maxease-profile';
const THEME_KEY = 'maxease-theme';

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: string;
  avatar: string;
};

const emptyProfile: ProfileData = {
  name: '',
  email: '',
  phone: '',
  whatsapp: '',
  role: '',
  avatar: '',
};

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
}

export default function Configuracao() {
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      const stored = raw ? JSON.parse(raw) : {};
      setProfile({
        ...emptyProfile,
        ...stored,
        email: stored.email || user?.email || '',
      });
    } catch {
      setProfile({ ...emptyProfile, email: user?.email || '' });
    }
  }, [user]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleSaveProfile = () => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      toast({ title: 'Perfil salvo', description: 'Suas informações foram atualizadas.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...profile, avatar: String(reader.result || '') };
      setProfile(next);
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch {}
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Senha curta', description: 'Mínimo de 6 caracteres.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Senhas diferentes', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPwd(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Senha alterada', description: 'Sua senha foi atualizada com sucesso.' });
    }
  };

  const accountCreatedAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—';
  const lastSignInAt = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : '—';
  const sessionExpires = session?.expires_at
    ? new Date(session.expires_at * 1000).toLocaleString('pt-BR')
    : '—';

  const initials = (profile.name || profile.email || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Configurações</h2>
        <p className="text-sm text-muted-foreground">Gerencie sua conta, aparência e preferências.</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="perfil" className="gap-1"><UserIcon className="h-4 w-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="aparencia" className="gap-1"><Palette className="h-4 w-4" /> Aparência</TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-1"><Shield className="h-4 w-4" /> Segurança</TabsTrigger>
          <TabsTrigger value="conta" className="gap-1"><CreditCard className="h-4 w-4" /> Conta</TabsTrigger>
          <TabsTrigger value="suporte" className="gap-1"><LifeBuoy className="h-4 w-4" /> Suporte</TabsTrigger>
        </TabsList>

        {/* PERFIL */}
        <TabsContent value="perfil" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {profile.avatar && <AvatarImage src={profile.avatar} alt={profile.name} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-border hover:bg-accent text-sm">
                    <Upload className="h-4 w-4" /> Enviar foto
                  </Label>
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <p className="text-xs text-muted-foreground mt-1">PNG ou JPG até 2MB.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="(00) 0000-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" value={profile.whatsapp} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="role">Cargo (opcional)</Label>
                  <Input id="role" value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>Salvar alterações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APARÊNCIA */}
        <TabsContent value="aparencia" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Escolha o tema da interface.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`text-left rounded-lg border p-4 transition ${theme === 'light' ? 'border-foreground ring-2 ring-foreground/20' : 'border-border hover:bg-accent'}`}
                >
                  <div className="flex items-center gap-2 mb-2"><Sun className="h-4 w-4" /> <span className="font-medium">Tema Claro</span></div>
                  <div className="h-16 rounded-md border" style={{ backgroundColor: '#ffffff' }} />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`text-left rounded-lg border p-4 transition ${theme === 'dark' ? 'border-foreground ring-2 ring-foreground/20' : 'border-border hover:bg-accent'}`}
                >
                  <div className="flex items-center gap-2 mb-2"><Moon className="h-4 w-4" /> <span className="font-medium">Tema Escuro</span></div>
                  <div className="h-16 rounded-md bg-zinc-900 border border-zinc-800" />
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEGURANÇA */}
        <TabsContent value="seguranca" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alterar senha</CardTitle>
              <CardDescription>Use uma senha forte com pelo menos 6 caracteres.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-pwd">Nova senha</Label>
                  <Input id="new-pwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pwd">Confirmar senha</Label>
                  <Input id="confirm-pwd" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={savingPwd}>{savingPwd ? 'Salvando...' : 'Alterar senha'}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessões ativas</CardTitle>
              <CardDescription>Informações sobre sua sessão atual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Dispositivo atual</span>
                <span className="font-medium">{navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Sessão expira em</span>
                <span className="font-medium">{sessionExpires}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Último acesso</span>
                <span className="font-medium">{lastSignInAt}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTA */}
        <TabsContent value="conta" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados da conta</CardTitle>
              <CardDescription>Informações sobre sua assinatura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Data de criação</span>
                <span className="font-medium">{accountCreatedAt}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Plano contratado</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data de renovação</span>
                <span className="font-medium">—</span>
              </div>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">As informações de plano e renovação serão exibidas após a integração com o sistema de cobrança.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUPORTE */}
        <TabsContent value="suporte" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Suporte</CardTitle>
              <CardDescription>Precisa de ajuda? Estamos aqui.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <a href="mailto:suporte@kora.com?subject=Central%20de%20ajuda" className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-accent transition">
                <HelpCircle className="h-5 w-5" />
                <div>
                  <div className="font-medium text-sm">Central de ajuda</div>
                  <div className="text-xs text-muted-foreground">Tire suas dúvidas</div>
                </div>
              </a>
              <a href="mailto:suporte@kora.com?subject=Reportar%20problema" className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-accent transition">
                <Bug className="h-5 w-5" />
                <div>
                  <div className="font-medium text-sm">Reportar problema</div>
                  <div className="text-xs text-muted-foreground">Encontrou um bug?</div>
                </div>
              </a>
              <a href="mailto:suporte@kora.com?subject=Solicitar%20funcionalidade" className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-accent transition">
                <Sparkles className="h-5 w-5" />
                <div>
                  <div className="font-medium text-sm">Solicitar funcionalidade</div>
                  <div className="text-xs text-muted-foreground">Sugira melhorias</div>
                </div>
              </a>
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <Info className="h-5 w-5" />
                <div>
                  <div className="font-medium text-sm">Sobre o sistema</div>
                  <div className="text-xs text-muted-foreground">Kora • v1.0.0</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}