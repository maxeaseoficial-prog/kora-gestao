import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import logoDark from '@/assets/kora-branca.png.asset.json';
import logoLight from '@/assets/kora-login.png.asset.json';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Forgot password flow
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'code'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const { user, signIn, signUp, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          const msg = error.message || '';
          const isCred =
            msg.includes('Invalid login credentials') ||
            msg.toLowerCase().includes('invalid') ||
            msg.toLowerCase().includes('email not confirmed');
          toast({
            title: 'Erro ao entrar',
            description: isCred ? 'O email ou a senha está incorreto.' : msg,
            variant: 'destructive',
          });
        } else {
          toast({
            title: "Bem-vindo!",
            description: "Login realizado com sucesso",
          });
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: "Erro ao cadastrar",
              description: "Este email já está cadastrado. Faça login.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro ao cadastrar",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Conta criada!",
            description: "Cadastro realizado com sucesso",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openForgot = () => {
    setForgotEmail(email);
    setForgotCode('');
    setForgotNewPass('');
    setForgotConfirmPass('');
    setForgotStep('email');
    setForgotOpen(true);
  };

  const handleSendCode = async () => {
    const parsed = z.string().trim().email().safeParse(forgotEmail);
    if (!parsed.success) {
      toast({ title: 'Email inválido', description: 'Digite um email válido.', variant: 'destructive' });
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-recovery-otp', {
        body: { email: parsed.data.toLowerCase() },
      });
      if (error) throw error;
      toast({
        title: 'Código enviado',
        description: 'Se o email estiver cadastrado, você receberá um código em instantes.',
      });
      setForgotStep('code');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message || 'Falha ao enviar código', variant: 'destructive' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (forgotCode.length !== 6) {
      toast({ title: 'Código inválido', description: 'O código tem 6 dígitos.', variant: 'destructive' });
      return;
    }
    if (forgotNewPass.length < 6) {
      toast({ title: 'Senha fraca', description: 'A senha deve ter no mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      toast({ title: 'Senhas não coincidem', description: 'Confirme a nova senha corretamente.', variant: 'destructive' });
      return;
    }
    setForgotLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-recovery-otp', {
        body: { email: forgotEmail.trim().toLowerCase(), code: forgotCode, newPassword: forgotNewPass },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: 'Senha alterada', description: 'Faça login com sua nova senha.' });
      setForgotOpen(false);
    } catch (e: any) {
      const msg = e?.message || 'Erro ao redefinir';
      const friendly =
        msg.includes('invalid_code') ? 'Código incorreto' :
        msg.includes('expired') ? 'Código expirado' :
        msg.includes('too_many_attempts') ? 'Muitas tentativas. Solicite um novo código.' :
        msg.includes('no_code') ? 'Nenhum código válido encontrado.' :
        msg;
      toast({ title: 'Erro', description: friendly, variant: 'destructive' });
    } finally {
      setForgotLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logoLight.url} alt="Kora" className="w-full max-w-sm h-auto block dark:hidden" />
            <img src={logoDark.url} alt="Kora" className="w-full max-w-sm h-auto hidden dark:block" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">
            {isLogin ? 'Entrar no Kora' : 'Criar conta'}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {isLogin 
              ? 'Entre com suas credenciais para acessar' 
              : 'Preencha os dados para criar sua conta'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={openForgot}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin 
                ? 'Não tem conta? Criar agora' 
                : 'Já tem conta? Entrar'}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>
              {forgotStep === 'email'
                ? 'Digite seu email. Se estiver cadastrado, enviaremos um código de 6 dígitos.'
                : 'Digite o código recebido no seu email e defina uma nova senha.'}
            </DialogDescription>
          </DialogHeader>

          {forgotStep === 'email' ? (
            <div className="space-y-3">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="forgot-code">Código</Label>
                <Input
                  id="forgot-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                />
              </div>
              <div>
                <Label htmlFor="forgot-new">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="forgot-new"
                    type={showForgotPass ? 'text' : 'password'}
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showForgotPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="forgot-confirm">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="forgot-confirm"
                    type={showForgotConfirm ? 'text' : 'password'}
                    value={forgotConfirmPass}
                    onChange={(e) => setForgotConfirmPass(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotConfirm((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showForgotConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {forgotStep === 'code' && (
              <Button variant="ghost" onClick={() => setForgotStep('email')} disabled={forgotLoading}>
                Voltar
              </Button>
            )}
            <Button
              onClick={forgotStep === 'email' ? handleSendCode : handleResetPassword}
              disabled={forgotLoading}
            >
              {forgotLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {forgotStep === 'email' ? 'Enviar código' : 'Redefinir senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Auth;
