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
  const [checking, setChecking] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user) { setChecking(false); return; }
      setChecking(true);
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        if (cancelled) return;
        if (error) setSubscribed(false);
        else setSubscribed(Boolean(data?.subscribed || data?.lifetime));
      } catch {
        if (!cancelled) setSubscribed(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [user]);

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
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full text-center space-y-6 border border-border rounded-2xl p-10 bg-card">
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
    );
  }

  return <>{children}</>;
}