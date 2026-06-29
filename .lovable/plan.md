## Refatoração do cadastro de clientes (Empresa / Pessoa)

### 1. Banco de dados (migração)
Adicionar à tabela `clients`:
- `client_type` text not null default 'empresa' — `'empresa' | 'pessoa'`
- `secondary_phone` text
- `gender` text — `'masculino' | 'feminino' | 'outro'`
- `age` integer (apenas para pessoa)
- `end_date` date — data de encerramento do contrato

Tornar `company` nullable (pessoas não têm empresa).

Cobranças recorrentes geradas mensalmente: filtrar para ignorar clientes cuja `end_date` já passou (lógica em `src/lib/revenue.ts` / `Caixa.tsx`).

### 2. Tipos
Atualizar `src/types/index.ts` (`Client`):
- `clientType: 'empresa' | 'pessoa'`
- `secondaryPhone?: string`
- `gender?: 'masculino' | 'feminino' | 'outro'`
- `age?: number`
- `endDate?: Date | null`
- `company` opcional

Atualizar `src/hooks/useClients.ts` para mapear os novos campos no fetch / insert / update.

### 3. Novo fluxo de UI em `src/pages/Clientes.tsx`

**Passo A — Modal de seleção de tipo**
Ao clicar em "Novo Cliente", abrir um Dialog com dois cards grandes (ícone + título + descrição + botão "Selecionar"):
- 🏢 Empresa
- 👤 Pessoa

Selecionar um card fecha esse modal e abre o formulário correspondente já pré-configurado com `clientType`.

**Passo B — Formulário unificado e inteligente**
Um único Dialog de formulário que se adapta ao `clientType`:

Seções visuais (com títulos):
1. **Dados pessoais**
   - Nome (sempre)
   - Nome da empresa (somente Empresa)
   - E-mail
   - Telefone principal
   - Telefone secundário (opcional)
   - Sexo (select)
   - Idade (somente Pessoa)
2. **Dados do contrato**
   - Tipo de serviço
   - Recorrência (Mensal / Pontual)
   - Valor
   - Dia do contrato — **renderizado apenas se Recorrência = Mensal**
3. **Controle**
   - Data de entrada
   - Data de encerramento (opcional, datepicker que pode ser limpo)
   - Status (somente Empresa, mantém comportamento atual)

Comportamento dinâmico:
- Mudar Recorrência para "Pontual" oculta `Dia do contrato` (sem reload).
- Edição reabre o formulário no modo correspondente ao `clientType` do cliente.

### 4. Regra de encerramento
Em `Caixa.tsx` / `revenue.ts` (geração de lançamentos recorrentes), pular clientes com `end_date` anterior ou igual ao mês alvo. Histórico anterior permanece intacto. Não há nada novo a apagar.

### 5. Lista de clientes
- Mostrar um pequeno badge "Empresa" / "Pessoa" na coluna Cliente.
- Coluna "Empresa" exibe `—` quando for pessoa.
- Indicar visualmente quando `endDate` estiver preenchida (texto "Encerrado em dd/MM/yyyy").

### 6. Responsividade
Grids dos formulários usam `grid-cols-1 md:grid-cols-2/3` para colapsar bem em mobile. Modal de seleção: cards em coluna no mobile, lado a lado em md+.

### Detalhes técnicos
- Sem mudanças em outras páginas além das listadas.
- Mantém shadcn (Dialog, Select, Popover/Calendar, Input, Button).
- Sem dependências novas.
- Sem alteração na lógica de Saídas, Dashboard, Compras.
