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
  const [hasAccess, setHasAccess] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
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
        let expiredTrial = false;
        for (let i = 0; i < attempts; i++) {
          const { data, error } = await supabase.functions.invoke('check-subscription');
          if (cancelled) return;
          if (!error && data) {
            // The server is the single source of truth for entitlement.
            const access = data.has_access ?? (data.subscribed || data.lifetime || data.trial_active);
            expiredTrial = Boolean(!access && data.trial_ends_at);
            if (access) { ok = true; break; }
          }
          if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
        }
        if (!cancelled) { setHasAccess(ok); setTrialExpired(expiredTrial); }
      } catch {
        if (!cancelled) { setHasAccess(false); setTrialExpired(false); }
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

  if (!hasAccess) {
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
              <h1 className="text-2xl font-semibold text-foreground">
                {trialExpired ? 'Seu período gratuito terminou' : 'Assinatura necessária'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {trialExpired
                  ? 'Seus 7 dias grátis chegaram ao fim. Escolha um plano para continuar usando o KORA.'
                  : 'Para acessar a plataforma KORA, você precisa de um plano ativo. Escolha abaixo o plano ideal para continuar utilizando o sistema.'}
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