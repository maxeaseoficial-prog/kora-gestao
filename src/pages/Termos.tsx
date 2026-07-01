import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import logoFull from '@/assets/kora-logo-outline.png.asset.json';

const sections: { title: string; body: (string | string[])[] }[] = [
  {
    title: '1. Sobre a KORA',
    body: [
      'A KORA é uma plataforma de gestão empresarial desenvolvida para auxiliar empresas e profissionais na organização e controle de suas operações.',
      'A plataforma disponibiliza funcionalidades como:',
      [
        'Dashboard gerencial;',
        'CRM;',
        'Gestão de clientes;',
        'Cadastro de produtos;',
        'Cadastro de serviços;',
        'Controle de fluxo de caixa;',
        'Controle de entradas e saídas;',
        'Compras;',
        'Faturamento;',
        'Metas e indicadores;',
        'Outras funcionalidades que venham a ser adicionadas futuramente.',
      ],
    ],
  },
  {
    title: '2. Cadastro',
    body: [
      'Para utilizar a plataforma é necessário criar uma conta.',
      'O usuário se compromete a fornecer informações verdadeiras, completas e atualizadas.',
      'Cada conta é de responsabilidade exclusiva do seu titular.',
      'É proibido:',
      [
        'utilizar dados falsos;',
        'compartilhar credenciais de acesso;',
        'criar contas para fins ilícitos.',
      ],
    ],
  },
  {
    title: '3. Segurança da Conta',
    body: [
      'O usuário é responsável por manter sua senha em sigilo.',
      'Toda atividade realizada utilizando sua conta será considerada de sua responsabilidade.',
      'Caso identifique qualquer acesso não autorizado, o usuário deverá comunicar imediatamente a equipe da KORA.',
    ],
  },
  {
    title: '4. Assinaturas',
    body: [
      'A KORA funciona por meio de assinatura.',
      'Os planos disponíveis poderão ser:',
      ['Plano Mensal', 'Plano Anual'],
      'O acesso à plataforma poderá depender da confirmação do pagamento.',
      'Os valores poderão ser alterados futuramente, respeitando os contratos e legislações aplicáveis.',
    ],
  },
  {
    title: '5. Pagamentos',
    body: [
      'Os pagamentos são processados por provedores especializados, como a Stripe.',
      'A KORA não armazena informações completas de cartões de crédito.',
      'As cobranças recorrentes ocorrerão conforme o plano contratado.',
      'Caso o pagamento não seja confirmado, o acesso poderá ser suspenso até a regularização.',
    ],
  },
  {
    title: '6. Cancelamento',
    body: [
      'O usuário poderá cancelar sua assinatura a qualquer momento.',
      'Após o cancelamento:',
      [
        'não serão realizadas novas cobranças;',
        'o acesso permanecerá ativo até o encerramento do período já pago;',
        'após esse período a conta poderá ser bloqueada.',
      ],
    ],
  },
  {
    title: '7. Disponibilidade',
    body: [
      'A KORA busca manter a plataforma disponível continuamente.',
      'Entretanto, poderão ocorrer interrupções para:',
      [
        'manutenção;',
        'melhorias;',
        'atualizações;',
        'problemas técnicos;',
        'eventos fora do nosso controle.',
      ],
      'Não garantimos disponibilidade ininterrupta do serviço.',
    ],
  },
  {
    title: '8. Uso Permitido',
    body: [
      'O usuário concorda em utilizar a plataforma apenas para fins legais.',
      'É proibido:',
      [
        'tentar invadir o sistema;',
        'realizar engenharia reversa;',
        'copiar funcionalidades;',
        'explorar vulnerabilidades;',
        'utilizar robôs para acesso não autorizado;',
        'distribuir vírus ou qualquer software malicioso.',
      ],
    ],
  },
  {
    title: '9. Propriedade Intelectual',
    body: [
      'Todo o conteúdo da plataforma pertence à KORA.',
      'Incluindo:',
      [
        'marca;',
        'logotipo;',
        'identidade visual;',
        'código-fonte;',
        'interface;',
        'banco de dados;',
        'design;',
        'documentação.',
      ],
      'Nenhum conteúdo poderá ser copiado, reproduzido ou comercializado sem autorização.',
    ],
  },
  {
    title: '10. Dados do Usuário',
    body: [
      'Os dados cadastrados pertencem ao usuário.',
      'A KORA utiliza essas informações exclusivamente para fornecer os serviços contratados.',
      'O tratamento dos dados ocorre conforme a Política de Privacidade e a legislação aplicável.',
    ],
  },
  {
    title: '11. Limitação de Responsabilidade',
    body: [
      'A KORA fornece uma plataforma para gestão empresarial.',
      'A responsabilidade pelas informações inseridas é exclusivamente do usuário.',
      'A KORA não se responsabiliza por:',
      [
        'perdas decorrentes de informações cadastradas incorretamente;',
        'decisões financeiras tomadas com base na plataforma;',
        'indisponibilidades causadas por terceiros;',
        'falhas de internet do usuário.',
      ],
    ],
  },
  {
    title: '12. Atualizações',
    body: [
      'A plataforma poderá receber novas funcionalidades, melhorias e alterações sem necessidade de aviso prévio.',
      'Os Termos de Uso também poderão ser atualizados.',
      'Sempre que houver alterações relevantes, a data da última atualização será modificada.',
    ],
  },
  {
    title: '13. Suspensão de Conta',
    body: [
      'A KORA poderá suspender ou cancelar contas que:',
      [
        'violem estes Termos;',
        'pratiquem atividades ilícitas;',
        'comprometam a segurança da plataforma;',
        'utilizem o sistema de forma abusiva.',
      ],
    ],
  },
  {
    title: '14. Suporte',
    body: [
      'O suporte será realizado pelos canais oficiais disponibilizados pela KORA.',
      'Os horários e formas de atendimento poderão ser alterados conforme necessidade.',
    ],
  },
  {
    title: '15. Legislação',
    body: [
      'Este documento é regido pelas leis da República Federativa do Brasil.',
      'Fica eleito o foro da comarca do domicílio da KORA para dirimir eventuais conflitos, ressalvadas as hipóteses previstas em lei.',
    ],
  },
  {
    title: '16. Contato',
    body: ['Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelos canais oficiais da KORA.'],
  },
];

export default function Termos() {
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.add('dark');
    return () => {
      if (!hadDark) html.classList.remove('dark');
    };
  }, []);

  useEffect(() => {
    document.title = 'Termos de Uso — KORA';
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta('description', 'Termos de Uso da plataforma KORA — Gestão Inteligente.');
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <header className="border-b border-white/5 bg-black/70 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-20 px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoFull.url} alt="KORA" className="h-16 w-auto" />
          </Link>
          <Link
            to="/"
            className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <p className="text-sm text-white/40 uppercase tracking-widest mb-4">Legal</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
          Termos de Uso
        </h1>
        <p className="mt-4 text-sm text-white/50">Última atualização: 01 de julho de 2026</p>

        <div className="mt-10 space-y-6 text-white/70 leading-relaxed">
          <p>Bem-vindo à KORA – Gestão Inteligente.</p>
          <p>
            Estes Termos de Uso regulam o acesso e a utilização da plataforma KORA. Ao criar uma
            conta ou utilizar nossos serviços, você declara que leu, compreendeu e concorda com
            todas as condições descritas neste documento.
          </p>
        </div>

        <div className="mt-14 space-y-12">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white mb-4">
                {s.title}
              </h2>
              <div className="space-y-3 text-white/70 leading-relaxed">
                {s.body.map((item, i) =>
                  Array.isArray(item) ? (
                    <ul key={i} className="list-disc pl-6 space-y-1.5 marker:text-white/30">
                      {item.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i}>{item}</p>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-sm text-white/50">
          <p className="font-medium text-white">KORA – Gestão Inteligente</p>
          <p className="mt-1">Organizando empresas com tecnologia, simplicidade e inteligência.</p>
        </div>
      </main>

      <footer className="border-t border-white/5 py-10 px-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} KORA. Todos os direitos reservados.
      </footer>
    </div>
  );
}