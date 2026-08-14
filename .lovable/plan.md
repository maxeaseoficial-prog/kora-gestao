# Plano: Implementação do Painel Administrativo

Este plano descreve a criação de uma área administrativa (`/admin`) para gerenciar usuários, planos e configurações do site, com acesso inicial por credenciais padrão.

## Alterações Técnicas

### Backend (Banco de Dados)
- Criar tabela `admin_settings` para armazenar as credenciais do administrador (login e hash da senha) e configurações globais.
- Criar tabela `user_plans_override` para permitir que o administrador atribua planos manualmente, substituindo a verificação do Stripe.
- Configurar RLS para proteger essas tabelas.

### Frontend
- **Nova Rota**: Adicionar `/admin` no `App.tsx`.
- **Página Admin**: Criar `src/pages/Admin.tsx` com:
    - Login administrativo (inicial: admin/admin).
    - Lista de usuários cadastrados (via Supabase Auth API/Views).
    - Interface para atribuição de planos (Vitalício, Mensal, Anual).
    - Configurações do site (gerenciamento das informações da landing page, etc).
    - Alteração das credenciais administrativas.
- **Sidebar**: Adicionar atalho para o Admin no `Layout.tsx` (visível apenas se logado como admin).
- **Lógica de Proteção**: Garantir que a rota `/admin` tenha seu próprio mecanismo de autenticação baseado na tabela `admin_settings`.

### Integração
- Atualizar a Edge Function `check-subscription` para considerar os overrides manuais do banco de dados além do Stripe e da lista hardcoded atual.

## Considerações de Segurança
- As credenciais administrativas serão armazenadas de forma segura.
- O acesso ao painel será restrito e independente da conta de usuário comum do Supabase Auth para o primeiro acesso, permitindo a gestão inicial.
