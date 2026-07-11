import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const [checking, setChecking] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!userId) { setChecking(false); return; }
      setChecking(true);
      // If returning from Stripe, retry a few times to avoid a race with
      // Stripe's subscription indexing (usually <2s).
      const justPaid = new URLSearchParams(window.location.search).get('checkout') === 'success';
      const attempts = justPaid ? 6 : 1;
      const delayMs = 1500;
      try {
        let ok = false;
        for (let i = 0; i < attempts; i++) {
          const { data, error } = await supabase.functions.invoke('check-subscription');
          if (cancelled) return;
          if (!error && (data?.subscribed || data?.lifetime)) { ok = true; break; }
          if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
        }
        if (!cancelled) setSubscribed(ok);
      } catch {
        if (!cancelled) setSubscribed(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [userId]);

  if (isLoading || (user && checking)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!subscribed) {
    return (
      <div className="relative min-h-screen">
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden pointer-events-none select-none blur-[2px] scale-[1.01] opacity-95"
        >
          {children}
        </div>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/20 px-6">
          <div className="max-w-md w-full text-center space-y-6 border border-border rounded-2xl p-10 bg-card shadow-2xl">
            <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6 text-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">Assinatura necessária</h1>
              <p className="text-sm text-muted-foreground">
                Para acessar a plataforma KORA, você precisa de um plano ativo.
                Escolha abaixo o plano ideal para continuar utilizando o sistema.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/planos')} className="w-full h-11 rounded-full">
                Escolher plano
              </Button>
              <Button
                variant="ghost"
                onClick={async () => { await supabase.auth.signOut(); navigate('/auth'); }}
                className="w-full h-11 rounded-full"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}