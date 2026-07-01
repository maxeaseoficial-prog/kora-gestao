import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import logoDark from '@/assets/kora-preta.png.asset.json';

const schema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.add('dark');
    return () => { if (!hadDark) html.classList.remove('dark'); };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) {
      const fe: typeof errors = {};
      parsed.error.errors.forEach(err => {
        const k = err.path[0] as keyof typeof errors;
        fe[k] = err.message;
      });
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: name },
        },
      });
      if (error) {
        toast({
          title: 'Erro ao cadastrar',
          description: error.message.includes('already registered')
            ? 'Este e-mail já está cadastrado. Faça login.'
            : error.message,
          variant: 'destructive',
        });
        return;
      }
      // Signout to prevent auto-login into system before checkout
      await supabase.auth.signOut();
      toast({ title: 'Conta criada!', description: 'Escolha seu plano para começar.' });
      navigate('/planos', { state: { email, name } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <Link to="/comecar" className="flex items-center gap-2 text-black/60 hover:text-black transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <img src={logoDark.url} alt="KORA" className="h-7 w-auto" />
        <div className="w-16" />
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Criar sua conta</h1>
            <p className="mt-3 text-black/60 text-sm">Leva menos de um minuto.</p>
          </div>
          <form onSubmit={onSubmit} className="rounded-3xl border border-black/10 bg-black/[0.02] p-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-black/80">Nome</Label>
              <Input
                id="name" value={name} onChange={e => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="bg-white border-black/15 text-black placeholder:text-black/30 h-12 rounded-xl"
                disabled={submitting}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black/80">E-mail</Label>
              <Input
                id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-white border-black/15 text-black placeholder:text-black/30 h-12 rounded-xl"
                disabled={submitting}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black/80">Senha</Label>
              <div className="relative">
                <Input
                  id="password" type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-white border-black/15 text-black placeholder:text-black/30 h-12 rounded-xl pr-11"
                  disabled={submitting}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-12 rounded-full bg-black text-white hover:bg-black/90">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Continuar
            </Button>
            <p className="text-xs text-black/50 text-center">
              Já tem conta? <Link to="/auth" className="text-black hover:underline">Fazer login</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}