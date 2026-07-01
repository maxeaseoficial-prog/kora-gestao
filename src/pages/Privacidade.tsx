import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import logoFull from '@/assets/kora-logo-outline.png.asset.json';

type Block = string | string[] | { subtitle: string; items: string[] };

const sections: { title: string; body: Block[] }[] = [
  {
    title: '1. Quem somos',
    body: [
      'A KORA é uma plataforma de gestão empresarial desenvolvida para auxiliar empresas na administração de clientes, serviços, produtos, finanças, CRM e indicadores de desempenho.',
    ],
  },
  {
    title: '2. Quais dados coletamos',
    body: [
      'Durante a utilização da plataforma, podemos coletar as seguintes informações:',
      {
        subtitle: 'Dados de cadastro',
        items: ['Nome', 'E-mail', 'Telefone', 'Nome da empresa', 'Senha criptografada'],
      },
      {
        subtitle: 'Dados inseridos pelo usuário',
        items: [
          'Clientes cadastrados',
          'Produtos',
          'Serviços',
          'Informações financeiras',
          'Compras',
          'Metas',
          'Histórico de utilização',
          'Projetos',
          'Outras informações cadastradas pelo próprio usuário',
        ],
      },
      {
        subtitle: 'Dados técnicos',
        items: [
          'Endereço IP',
          'Navegador utilizado',
          'Sistema operacional',
          'Data e horário de acesso',
          'Informações de dispositivo',
          'Cookies e tecnologias semelhantes',
        ],
      },
    ],
  },
  {
    title: '3. Como utilizamos seus dados',
    body: [
      'Os dados são utilizados para:',
      [
        'Criar e manter sua conta;',
        'Fornecer acesso à plataforma;',
        'Processar assinaturas;',
        'Melhorar nossos serviços;',
        'Garantir a segurança da aplicação;',
        'Prevenir fraudes;',
        'Enviar comunicações relacionadas à conta;',
        'Cumprir obrigações legais.',
      ],
      'Não utilizamos seus dados para finalidades incompatíveis com esta Política.',
    ],
  },
  {
    title: '4. Compartilhamento de dados',
    body: [
      'A KORA não vende dados pessoais.',
      'Os dados poderão ser compartilhados apenas quando necessário com empresas parceiras responsáveis por:',
      [
        'Processamento de pagamentos;',
        'Hospedagem da plataforma;',
        'Serviços de autenticação;',
        'Envio de e-mails;',
        'Cumprimento de obrigações legais.',
      ],
      'Todos os parceiros seguem padrões adequados de segurança e confidencialidade.',
    ],
  },
  {
    title: '5. Pagamentos',
    body: [
      'Os pagamentos são processados por plataformas especializadas, como a Stripe.',
      'A KORA não armazena números completos de cartões de crédito ou outras informações financeiras sensíveis.',
      'Esses dados são tratados diretamente pelo provedor de pagamento.',
    ],
  },
  {
    title: '6. Cookies',
    body: [
      'Utilizamos cookies para:',
      [
        'Manter sua sessão ativa;',
        'Melhorar a experiência de navegação;',
        'Personalizar funcionalidades;',
        'Analisar o desempenho da plataforma.',
      ],
      'O usuário pode desativar os cookies nas configurações do navegador, embora isso possa afetar algumas funcionalidades.',
    ],
  },
  {
    title: '7. Armazenamento dos dados',
    body: [
      'Os dados são armazenados em ambientes protegidos e monitorados, utilizando medidas técnicas e administrativas para reduzir riscos de acesso não autorizado, perda, alteração ou divulgação indevida.',
    ],
  },
  {
    title: '8. Segurança',
    body: [
      'A KORA adota boas práticas de segurança, incluindo:',
      [
        'Criptografia de senhas;',
        'Comunicação protegida por HTTPS;',
        'Controle de acesso;',
        'Monitoramento de segurança;',
        'Atualizações constantes da plataforma.',
      ],
      'Embora adotemos medidas rigorosas, nenhum sistema é totalmente imune a riscos.',
    ],
  },
  {
    title: '9. Direitos do usuário',
    body: [
      'Nos termos da LGPD, o usuário poderá solicitar:',
      [
        'Confirmação da existência de tratamento de dados;',
        'Acesso aos seus dados;',
        'Correção de informações incorretas;',
        'Atualização de dados;',
        'Exclusão de dados, quando aplicável;',
        'Portabilidade dos dados;',
        'Revogação do consentimento, quando este for a base legal do tratamento.',
      ],
      'As solicitações poderão ser feitas pelos canais oficiais de atendimento da KORA.',
    ],
  },
  {
    title: '10. Retenção dos dados',
    body: [
      'Os dados serão mantidos enquanto forem necessários para:',
      [
        'Prestação dos serviços;',
        'Cumprimento de obrigações legais;',
        'Exercício regular de direitos;',
        'Garantia da segurança da plataforma.',
      ],
      'Após esse período, os dados poderão ser excluídos ou anonimizados, conforme a legislação aplicável.',
    ],
  },
  {
    title: '11. Dados de terceiros',
    body: [
      'Os usuários são responsáveis pelos dados de clientes, fornecedores ou terceiros cadastrados dentro da plataforma.',
      'A KORA atua apenas como operadora da plataforma, sendo o usuário responsável pelo tratamento adequado dessas informações, conforme a legislação vigente.',
    ],
  },
  {
    title: '12. Alterações desta Política',
    body: [
      'Esta Política poderá ser atualizada para refletir melhorias na plataforma, mudanças legais ou novos recursos.',
      'Sempre que houver alterações relevantes, a data de atualização deste documento será modificada.',
    ],
  },
  {
    title: '13. Contato',
    body: [
      'Em caso de dúvidas, solicitações ou questões relacionadas à privacidade e proteção de dados, entre em contato pelos canais oficiais da KORA.',
    ],
  },
  {
    title: '14. Aceitação',
    body: [
      'Ao criar uma conta e utilizar a plataforma KORA, o usuário declara que leu, compreendeu e concorda com esta Política de Privacidade.',
    ],
  },
];

export default function Privacidade() {
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.add('dark');
    return () => {
      if (!hadDark) html.classList.remove('dark');
    };
  }, []);

  useEffect(() => {
    document.title = 'Política de Privacidade — KORA';
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta('description', 'Política de Privacidade da plataforma KORA — Gestão Inteligente. Conformidade com a LGPD.');
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
          Política de Privacidade
        </h1>
        <p className="mt-4 text-sm text-white/50">Última atualização: 01 de julho de 2026</p>

        <div className="mt-10 space-y-6 text-white/70 leading-relaxed">
          <p>
            A KORA – Gestão Inteligente respeita a sua privacidade e está comprometida com a
            proteção dos seus dados pessoais. Esta Política de Privacidade explica como coletamos,
            utilizamos, armazenamos e protegemos as informações fornecidas pelos usuários da
            plataforma, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 –
            LGPD).
          </p>
          <p>Ao utilizar a plataforma KORA, você concorda com as práticas descritas nesta Política.</p>
        </div>

        <div className="mt-14 space-y-12">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white mb-4">
                {s.title}
              </h2>
              <div className="space-y-3 text-white/70 leading-relaxed">
                {s.body.map((item, i) => {
                  if (Array.isArray(item)) {
                    return (
                      <ul key={i} className="list-disc pl-6 space-y-1.5 marker:text-white/30">
                        {item.map((li) => (
                          <li key={li}>{li}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (typeof item === 'object') {
                    return (
                      <div key={i} className="mt-2">
                        <h3 className="text-base font-medium text-white/90 mb-2">{item.subtitle}</h3>
                        <ul className="list-disc pl-6 space-y-1.5 marker:text-white/30">
                          {item.items.map((li) => (
                            <li key={li}>{li}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return <p key={i}>{item}</p>;
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-sm text-white/50">
          <p className="font-medium text-white">KORA – Gestão Inteligente</p>
          <p className="mt-1">Sua empresa organizada com mais controle, segurança e inteligência.</p>
        </div>
      </main>

      <footer className="border-t border-white/5 py-10 px-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} KORA. Todos os direitos reservados.
      </footer>
    </div>
  );
}