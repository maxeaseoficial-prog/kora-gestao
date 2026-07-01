import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Kanban, Users, Package, Box, Wallet, TrendingUp, Target,
  ArrowRight, Check, Sparkles, Menu, X,
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import logoDark from '@/assets/kora-branca.png.asset.json';

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

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

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
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoDark.url} alt="KORA" className="h-7 w-auto" />
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
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-white/[0.04] blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
        </div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-white/70 mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              Gestão empresarial moderna
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
              Gestão inteligente para empresas que querem crescer.
            </h1>
            <p className="mt-8 text-lg text-white/60 leading-relaxed max-w-xl">
              Centralize clientes, CRM, serviços, produtos, fluxo de caixa, faturamento e metas em uma única plataforma simples, rápida e intuitiva.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
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
          <div className="relative">
            {/* Dashboard mockup placeholder — substituir por captura real depois */}
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-2 shadow-2xl shadow-black/50">
              <div className="rounded-xl overflow-hidden bg-neutral-950 aspect-[16/10] flex items-center justify-center text-white/30 text-sm">
                [Mockup do Dashboard]
              </div>
            </div>
            <div className="absolute -inset-6 -z-10 bg-white/[0.04] blur-3xl rounded-full" />
          </div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="py-10 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-white/50">
          {benefits.map(b => (
            <span key={b} className="whitespace-nowrap">{b}</span>
          ))}
        </div>
      </section>

      {/* Tudo em um só lugar */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              Pare de usar várias ferramentas.
            </h2>
            <p className="mt-6 text-lg text-white/60 leading-relaxed">
              A KORA reúne toda a gestão da sua empresa em um único painel.
            </p>
          </div>
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-2">
            <div className="rounded-xl overflow-hidden bg-neutral-950 aspect-[16/10] flex items-center justify-center text-white/30 text-sm">
              [Imagem do Dashboard]
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="py-32 px-6 border-t border-white/5">
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
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-sm text-white/40 uppercase tracking-widest mb-4">Como funciona</p>
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
              <div key={i} className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-8">
                <div className="text-5xl font-semibold text-white/10 mb-4">{i + 1}</div>
                <p className="text-white/80 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-32 px-6 border-t border-white/5">
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
                onClick={() => navigate('/comecar')}
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

      {/* FAQ */}
      <section id="faq" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-white/40 uppercase tracking-widest mb-4">FAQ</p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Perguntas frequentes.
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-white/10">
                <AccordionTrigger className="text-left text-base hover:no-underline text-white py-6">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/60 leading-relaxed pb-6">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6 border-t border-white/5">
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
      <footer className="border-t border-white/5 py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <img src={logoDark.url} alt="KORA" className="h-7 w-auto mb-4" />
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
              <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4">Social</h4>
            <ul className="space-y-3 text-sm text-white/50">
              <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
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