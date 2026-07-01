import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, EyeOff, Loader2, Check, Circle } from 'lucide-react';
import { z } from 'zod';
import logoDark from '@/assets/kora-logo-preta-full.png.asset.json';

const passwordRules = [
  { key: 'len', label: 'Mínimo de 8 caracteres', test: (v: string) => v.length >= 8 },
  { key: 'upper', label: 'Uma letra maiúscula', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Uma letra minúscula', test: (v: string) => /[a-z]/.test(v) },
  { key: 'num', label: 'Um número', test: (v: string) => /[0-9]/.test(v) },
  { key: 'special', label: 'Um caractere especial', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

const strongPassword = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula')
  .regex(/[0-9]/, 'Inclua ao menos um número')
  .regex(/[^A-Za-z0-9]/, 'Inclua ao menos um caractere especial');

const schema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome'),
    email: z.string().trim().email('E-mail inválido'),
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  });

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
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
    const parsed = schema.safeParse({ name, email, password, confirmPassword });
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

  const ruleStatus = passwordRules.map(r => ({ ...r, ok: r.test(password) }));
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <Link to="/comecar" className="flex items-center gap-2 text-black/60 hover:text-black transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <img src={logoDark.url} alt="KORA" className="h-16 md:h-20 w-auto" />
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
                  placeholder="Crie uma senha forte"
                  className="bg-white border-black/15 text-black placeholder:text-black/30 h-12 rounded-xl pr-11"
                  disabled={submitting}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
              <ul className="mt-3 space-y-1.5">
                {ruleStatus.map(r => (
                  <li
                    key={r.key}
                    className={`flex items-center gap-2 text-xs transition-colors ${
                      r.ok ? 'text-black' : 'text-black/40'
                    }`}
                  >
                    {r.ok ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                    <span>{r.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-black/80">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword" type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="bg-white border-black/15 text-black placeholder:text-black/30 h-12 rounded-xl pr-11"
                  disabled={submitting}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword}</p>
              )}
              {!errors.confirmPassword && confirmPassword.length > 0 && (
                <p className={`text-xs ${passwordsMatch ? 'text-black/60' : 'text-red-600'}`}>
                  {passwordsMatch ? 'As senhas coincidem.' : 'As senhas não coincidem.'}
                </p>
              )}
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