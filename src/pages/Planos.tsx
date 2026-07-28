import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logoOutline from '@/assets/kora-logo-outline-planos.png.asset.json';

export default function Planos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const stateEmail = (location.state as { email?: string } | null)?.email;

  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.add('dark');
    return () => { if (!hadDark) html.classList.remove('dark'); };
  }, []);

  const handleCheckout = async (plan: 'mensal' | 'anual') => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email ?? stateEmail;
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan, ...(email ? { email } : {}) },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao iniciar checkout';
      toast({ title: 'Erro no checkout', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Início
        </Link>
        <img src={logoOutline.url} alt="KORA" className="h-16 md:h-20 w-auto" />
        <div className="w-16" />
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-5xl animate-fade-in">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Escolha seu plano</h1>
            <p className="mt-4 text-white/60">Você pode trocar ou cancelar quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {/* Mensal */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 flex flex-col">
              <h3 className="text-xl font-semibold">Plano Mensal</h3>
              <p className="text-sm text-white/50 mt-2">Flexibilidade total, sem compromisso de longo prazo.</p>
              <div className="mt-8 mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tracking-tight">R$ 39,90</span>
                  <span className="text-white/50">/mês</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-white/70 mb-10 flex-1">
                {['Acesso completo à plataforma','Dashboard, CRM, Clientes, Produtos','Serviços, Caixa, Faturamento, Metas','Atualizações contínuas','Suporte'].map(x => (
                  <li key={x} className="flex gap-3"><Check className="h-4 w-4 text-white/40 mt-0.5 shrink-0" />{x}</li>
                ))}
              </ul>
              <Button onClick={() => handleCheckout('mensal')} variant="outline" className="w-full rounded-full h-12 bg-transparent border-white/20 text-white hover:bg-white/5 hover:text-white">
                Assinar Mensal
              </Button>
            </div>
            {/* Anual */}
            <div className="relative rounded-3xl border border-white/30 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-10 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white text-black text-xs font-medium px-4 py-1.5">
                Mais Popular
              </div>
              <h3 className="text-xl font-semibold">Plano Anual</h3>
              <p className="text-sm text-white/60 mt-2">Melhor custo-benefício. Ideal para o ano todo.</p>
              <div className="mt-8 mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tracking-tight">R$ 397</span>
                  <span className="text-white/50">/ano</span>
                </div>
                <div className="text-sm text-white/60 mt-2">Apenas <span className="text-white font-medium">R$ 33,08</span> por mês</div>
                <div className="inline-block mt-3 text-xs bg-white/10 text-white rounded-full px-3 py-1">
                  Economize R$ 81,80 por ano
                </div>
              </div>
              <ul className="space-y-3 text-sm text-white/80 mb-10 flex-1">
                {['Todos os recursos do Mensal','Economia anual','Atualizações contínuas','Suporte'].map(x => (
                  <li key={x} className="flex gap-3"><Check className="h-4 w-4 text-white mt-0.5 shrink-0" />{x}</li>
                ))}
              </ul>
              <Button onClick={() => handleCheckout('anual')} className="w-full rounded-full h-12 bg-white text-black hover:bg-white/90">
                Assinar Anual
              </Button>
            </div>
          </div>
          <p className="text-center text-xs text-white/40 mt-10">
            Pagamento seguro processado pela Stripe. Sua assinatura será ativada automaticamente após a confirmação.
          </p>
        </div>
      </main>
    </div>
  );
}