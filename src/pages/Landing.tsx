import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LayoutDashboard, Kanban, Users, Package, Box, Wallet, TrendingUp, Target,
  ArrowRight, Check, Sparkles, Menu, X, Mail, Instagram, Sun, Moon,
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import logoFull from '@/assets/kora-logo-outline.png.asset.json';
import mockupDashboard from '@/assets/kora-mockup-dashboard.png.asset.json';
import mockupCRM from '@/assets/kora-mockup-crm.png.asset.json';
import mockupProgresso from '@/assets/kora-mockup-progresso.png.asset.json';
import mockupOrigem from '@/assets/kora-mockup-origem.png.asset.json';
import mockupFaturamento from '@/assets/kora-mockup-faturamento.png.asset.json';
import mockupDashboardDark from '@/assets/kora-mockup-dashboard-dark.png.asset.json';
import mockupMetaAnual from '@/assets/kora-mockup-meta-anual.png.asset.json';
import mockupCrmClaro from '@/assets/kora-mockup-crm-claro.png.asset.json';

const features = [
  { icon: LayoutDashboard, title: 'Dashboard', desc: 'Visão geral e indicadores em tempo real.' },
  { icon: Kanban, title: 'CRM', desc: 'Funil de vendas em kanban, do primeiro contato ao fechamento.' },
  { icon: Users, title: 'Clientes', desc: 'Base completa com histórico e informações centralizadas.' },
  { icon: Box, title: 'Produtos', desc: 'Cadastro, preços e histórico organizados em um só lugar.' },
  { icon: Package, title: 'Serviços', desc: 'Gerencie serviços recorrentes e pontuais com clareza.' },
  { icon: Wallet, title: 'Fluxo de Caixa', desc: 'Entradas, saídas e saldo sempre atualizados.' },
  { icon: TrendingUp, title: 'Faturamento', desc: 'Acompanhe o resultado da empresa em tempo real.' },
  { icon: Target, title: 'Metas', desc: 'Defina objetivos e acompanhe o progresso mês a mês.' },
];

const benefits = [
  'Dashboard Inteligente', 'CRM Integrado', 'Gestão de Clientes', 'Produtos',
  'Serviços', 'Fluxo de Caixa', 'Faturamento', 'Metas',
];

const faqs = [
  { q: 'Posso cancelar quando quiser?', a: 'Sim. Você pode cancelar sua assinatura a qualquer momento, sem multa ou burocracia.' },
  { q: 'Como funciona o pagamento?', a: 'O pagamento é processado com segurança pela Stripe, com cartão de crédito. Você escolhe entre plano mensal ou anual.' },
  { q: 'Preciso instalar algum programa?', a: 'Não. A KORA é 100% online. Acesse pelo navegador em qualquer dispositivo, ou instale como aplicativo (PWA).' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Utilizamos infraestrutura de nível empresarial com criptografia e backups automáticos.' },
  { q: 'Posso trocar de plano depois?', a: 'Claro. Você pode mudar do plano mensal para o anual (ou vice-versa) quando quiser.' },
];

function MockupCarousel({ slides }: { slides: { src: string; alt: string }[] }) {
  const loop = [...slides, ...slides];
  const duration = Math.max(30, slides.length * 6);
  return (
    <div className="max-w-6xl mx-auto">
      <style>{`@keyframes kora-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      <div
        className="relative overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
        }}
      >
        <div
          className="flex w-max gap-6"
          style={{ animation: `kora-marquee ${duration}s linear infinite` }}
        >
          {loop.map((s, i) => (
            <div
              key={i}
              className="shrink-0 rounded-2xl border border-black/10 bg-gradient-to-br from-black/[0.04] to-black/[0.01] p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]"
            >
              <div className="rounded-xl overflow-hidden bg-white w-[85vw] sm:w-[520px] md:w-[640px] lg:w-[760px] aspect-[16/10]">
                <img
                  src={s.src}
                  alt={s.alt}
                  loading="lazy"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubscribeMonthly = async () => {
    if (!user) {
      sessionStorage.setItem('pendingCheckout', 'monthly');
      navigate('/comecar');
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
      else throw new Error('URL de checkout não recebida');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao iniciar checkout';
      toast.error(msg);
    }
  };

  // Landing is a self-contained dark/light marketing page.
  // Force the `dark` class on <html> while mounted so the app's
  // "text-white → foreground" overrides don't kill contrast here.
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.add('dark');
    return () => {
      if (!hadDark) html.classList.remove('dark');
    };
  }, []);

  useEffect(() => {
    document.title = 'KORA — Gestão inteligente para empresas que querem crescer';
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta('description', 'Centralize clientes, CRM, serviços, produtos, fluxo de caixa, faturamento e metas em uma única plataforma simples, rápida e intuitiva.');
  }, []);

  return (
    <div className="min-h-screen bg-black text-white antialiased selection:bg-white selection:text-black">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-24 md:h-28 px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoFull.url} alt="KORA" className="h-20 md:h-24 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Link to="/auth" className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2">
              Fazer Login
            </Link>
            <Button
              onClick={() => navigate('/comecar')}
              className="bg-white text-black hover:bg-white/90 rounded-full h-10 px-5"
            >
              Começar Agora
            </Button>
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-black px-6 py-4 flex flex-col gap-3 text-sm">
            <a href="#recursos" onClick={() => setMobileOpen(false)} className="text-white/80 py-2">Recursos</a>
            <a href="#planos" onClick={() => setMobileOpen(false)} className="text-white/80 py-2">Planos</a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-white/80 py-2">FAQ</a>
            <Link to="/auth" className="text-white/80 py-2">Fazer Login</Link>
            <Button onClick={() => navigate('/comecar')} className="bg-white text-black hover:bg-white/90 rounded-full">
              Começar Agora
            </Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-white/[0.04] blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
        </div>

        <div className="max-w-7xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-white/70 mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              Gestão empresarial moderna
            </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] max-w-4xl mx-auto">
              Gestão inteligente para empresas que querem crescer.
            </h1>
          <p className="mt-8 text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
              Centralize clientes, CRM, serviços, produtos, fluxo de caixa, faturamento e metas em uma única plataforma simples, rápida e intuitiva.
            </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => navigate('/comecar')}
                className="bg-white text-black hover:bg-white/90 rounded-full h-12 px-7 text-base"
              >
                Começar Agora <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full h-12 px-7 text-base bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
              >
                <a href="#planos">Ver Planos</a>
              </Button>
            </div>
        </div>

        {/* YouTube video placeholder */}
        <div className="max-w-5xl mx-auto mt-20 px-2">
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-2 shadow-2xl shadow-black/50">
            <div className="rounded-xl overflow-hidden bg-black aspect-video">
              {/* TODO: substituir VIDEO_ID pelo ID do vídeo do YouTube */}
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/VIDEO_ID"
                title="Apresentação KORA"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="absolute -inset-6 -z-10 bg-white/[0.04] blur-3xl rounded-full" />
          </div>
        </div>
      </section>

      {/* Benefits bar — LIGHT */}
      <section className="py-10 px-6 bg-white text-black border-y border-black/10">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-black/60">
          {benefits.map(b => (
            <span key={b} className="whitespace-nowrap">{b}</span>
          ))}
        </div>
      </section>

      {/* Tudo em um só lugar — LIGHT (carrossel automático) */}
      <section className="py-32 px-6 bg-white text-black">
        <div className="max-w-4xl mx-auto text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            Pare de usar várias ferramentas.
          </h2>
          <p className="mt-6 text-lg text-black/60 leading-relaxed">
            A KORA reúne toda a gestão da sua empresa em um único painel.
          </p>
        </div>
        <MockupCarousel
          slides={[
            { src: mockupDashboard.url, alt: 'Dashboard da KORA' },
            { src: mockupCRM.url, alt: 'CRM da KORA' },
            { src: mockupProgresso.url, alt: 'Metas e progresso' },
            { src: mockupOrigem.url, alt: 'Origem dos clientes' },
            { src: mockupFaturamento.url, alt: 'Evolução de faturamento e status do CRM' },
            { src: mockupDashboardDark.url, alt: 'Dashboard KORA em tema escuro' },
            { src: mockupMetaAnual.url, alt: 'Meta anual e distribuição mensal' },
            { src: mockupCrmClaro.url, alt: 'CRM em tema claro' },
          ]}
        />
        <div className="max-w-3xl mx-auto mt-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white p-1 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-black text-white px-4 py-2 text-sm font-medium">
              <Moon className="h-4 w-4" /> Escuro
            </span>
            <span className="inline-flex items-center gap-2 rounded-full text-black/60 px-4 py-2 text-sm">
              <Sun className="h-4 w-4" /> Claro
            </span>
          </div>
          <h3 className="mt-6 text-2xl md:text-3xl font-semibold tracking-tight">
            Tema claro ou escuro, do seu jeito.
          </h3>
          <p className="mt-3 text-black/60 leading-relaxed">
            Personalize a aparência da KORA para combinar com o seu estilo de trabalho — alterne entre modo claro e escuro com um clique.
          </p>
        </div>
      </section>

      {/* Recursos — DARK */}
      <section id="recursos" className="py-32 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-sm text-white/40 uppercase tracking-widest mb-4">Recursos</p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              Tudo o que sua empresa precisa.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20"
              >
                <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-all">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona — LIGHT */}
      <section className="py-32 px-6 bg-white text-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-sm text-black/40 uppercase tracking-widest mb-4">Como funciona</p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Comece em minutos.
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              'Crie sua conta gratuitamente.',
              'Escolha o plano ideal.',
              'Realize o pagamento com segurança.',
              'Acesse imediatamente a plataforma.',
            ].map((step, i) => (
              <div key={i} className="relative rounded-2xl border border-black/10 bg-black/[0.02] p-8">
                <div className="text-5xl font-semibold text-black/15 mb-4">{i + 1}</div>
                <p className="text-black/80 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos — DARK */}
      <section id="planos" className="py-32 px-6 bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-white/40 uppercase tracking-widest mb-4">Planos</p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Escolha como quer crescer.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Mensal */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 flex flex-col">
              <h3 className="text-xl font-semibold">Plano Mensal</h3>
              <p className="text-sm text-white/50 mt-2">Ideal para quem busca flexibilidade e deseja começar sem compromisso de longo prazo.</p>
              <div className="mt-8 mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tracking-tight">R$ 69,90</span>
                  <span className="text-white/50">/mês</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-white/70 mb-10 flex-1">
                {['Acesso completo à plataforma','Dashboard Inteligente','CRM','Clientes','Produtos','Serviços','Fluxo de Caixa','Faturamento','Metas','Atualizações contínuas','Suporte'].map(x => (
                  <li key={x} className="flex gap-3"><Check className="h-4 w-4 text-white/40 mt-0.5 shrink-0" />{x}</li>
                ))}
              </ul>
              <Button
                onClick={handleSubscribeMonthly}
                variant="outline"
                className="w-full rounded-full h-12 bg-transparent border-white/20 text-white hover:bg-white/5 hover:text-white"
              >
                Começar Agora
              </Button>
            </div>

            {/* Anual — destaque */}
            <div className="relative rounded-3xl border border-white/30 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-10 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white text-black text-xs font-medium px-4 py-1.5">
                Mais Popular
              </div>
              <h3 className="text-xl font-semibold">Plano Anual</h3>
              <p className="text-sm text-white/60 mt-2">Ideal para empresas que desejam economizar e manter uma gestão organizada durante todo o ano.</p>
              <div className="mt-8 mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tracking-tight">R$ 597</span>
                  <span className="text-white/50">/ano</span>
                </div>
                <div className="text-sm text-white/60 mt-2">Apenas <span className="text-white font-medium">R$ 49,75</span> por mês</div>
                <div className="inline-block mt-3 text-xs bg-white/10 text-white rounded-full px-3 py-1">
                  Economize R$ 242,80 por ano
                </div>
              </div>
              <ul className="space-y-3 text-sm text-white/80 mb-10 flex-1">
                {['Todos os recursos do Plano Mensal','Melhor custo-benefício','Economia anual','Atualizações contínuas','Suporte'].map(x => (
                  <li key={x} className="flex gap-3"><Check className="h-4 w-4 text-white mt-0.5 shrink-0" />{x}</li>
                ))}
              </ul>
              <Button
                onClick={() => navigate('/comecar')}
                className="w-full rounded-full h-12 bg-white text-black hover:bg-white/90"
              >
                Começar Agora
              </Button>
            </div>
          </div>
          <p className="text-center text-sm text-white/40 mt-10">
            Você cria sua conta gratuitamente. O pagamento será solicitado apenas após escolher o plano.
          </p>
        </div>
      </section>

      {/* FAQ — LIGHT */}
      <section id="faq" className="py-32 px-6 bg-white text-black">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-black/40 uppercase tracking-widest mb-4">FAQ</p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Perguntas frequentes.
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-black/10">
                <AccordionTrigger className="text-left text-base hover:no-underline text-black py-6">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-black/60 leading-relaxed pb-6">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final — DARK */}
      <section className="py-32 px-6 bg-black text-white border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight">
            Comece hoje mesmo.
          </h2>
          <p className="mt-6 text-lg text-white/60 max-w-xl mx-auto">
            Organize sua empresa com uma plataforma moderna, simples e inteligente.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => navigate('/comecar')}
              className="bg-white text-black hover:bg-white/90 rounded-full h-12 px-7 text-base"
            >
              Criar Conta Gratuita <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full h-12 px-7 text-base bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
            >
              <a href="#planos">Ver Planos</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <img src={logoFull.url} alt="KORA" className="h-12 md:h-14 w-auto mb-4" />
            <p className="text-sm text-white/40">Gestão inteligente para o seu negócio.</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4">Produto</h4>
            <ul className="space-y-3 text-sm text-white/50">
              <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
              <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
              <li><Link to="/auth" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-white/50">
              <li><Link to="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4">Contato</h4>
            <ul className="space-y-3 text-sm text-white/50">
              <li>
                <a
                  href="mailto:koragestaointeligente@gmail.com"
                  className="flex items-center gap-2 hover:text-white transition-colors break-all"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>koragestaointeligente@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/koragestao/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Instagram className="h-4 w-4 shrink-0" />
                  <span>@koragestao</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-xs text-white/30">
          © {new Date().getFullYear()} KORA. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}