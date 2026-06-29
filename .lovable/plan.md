# Planejamento e Metas — Refatoração completa

Vou transformar a página atual `Faturamento` em um módulo completo **Planejamento e Metas**, mantendo a identidade visual existente (dark theme, cards padronizados, sem vermelho como cor principal) e aproveitando todos os cadastros já existentes (Clientes, Caixa, Produtos, Serviços).

## Estrutura da página

Nova página `src/pages/Planejamento.tsx` (substituindo o conteúdo de `Faturamento.tsx` mas mantendo a rota `/faturamento` para não quebrar links — também adiciono alias `/planejamento`). Sidebar/menu passa a exibir "Planejamento e Metas".

Navegação interna por tabs (componente `Tabs` do shadcn):

1. **Visão Geral** — painel estratégico
2. **Metas Anuais**
3. **Metas Mensais**
4. **Objetivos**
5. **Progresso** — gráficos
6. **Histórico**

## 1. Visão Geral

Painel topo com indicadores inteligentes do mês corrente:
- Meta do mês, Realizado, Restante, % atingido
- Dias restantes, Valor necessário/dia
- Projeção fim do mês (ritmo atual)
- **Saúde da Meta** — classificação automática

Algoritmo de saúde (baseado em `% realizado` vs `% do mês decorrido`):
- ratio ≥ 1.0 → 🟢 Excelente
- ratio ≥ 0.85 → 🔵 No ritmo
- ratio ≥ 0.6 → 🟡 Atenção
- < 0.6 → 🔴 Crítico

Abaixo:
- **Distribuição dos Objetivos** — gráfico Doughnut (recharts) por tipo (Produtos / Serviços / Contratos / Outros)
- **Objetivos da Meta** — lista com Meta, Realizado, Restante, %, status
- **Resumo Rápido** — contratos/produtos/serviços necessários × realizados × restantes
- **Projeção fim do mês** — 3 cenários (manter / +10% / -10%)
- **Dicas para bater a meta** — geradas automaticamente a partir dos objetivos com maior gap

## 2. Metas Anuais

Lista de anos cadastrados. Cadastrar Ano + Valor anual + Descrição. Ao salvar, divide automaticamente por 12 nas metas mensais (sem sobrescrever meses já editados manualmente — marcador `is_manual`).

Ao editar um mês individual em **Metas Mensais**, abre confirmação:
> Esta alteração deve recalcular a meta anual?
- Sim → soma os 12 meses e atualiza anual
- Não → marca o mês como manual e mantém anual

Gráfico de barras da distribuição mensal + KPIs (anual, realizado, restante, necessário/mês, %).

## 3. Metas Mensais

Tabela: Mês | Meta | Realizado | Restante | % | Status | Ações (Editar / Duplicar para próximo mês).

"Duplicar planejamento" copia objetivos + distribuições do mês selecionado para o mês alvo.

## 4. Objetivos

Tela central. Para cada mês o usuário cria N objetivos:

Modal "Novo Objetivo" multi-etapas:
1. Tipo: Produto / Serviço / Contrato / Outro
2. Selecionar cadastro existente (dropdown de `products` / `services` / `clients`) ou nome manual
3. Definir Meta Financeira **OU** Quantidade — o sistema calcula o outro usando o preço vigente
4. Salvar

Cada objetivo mostra: Meta, Realizado, Faltante, %, contratos/produtos/serviços necessários × realizados × restantes.

**Integração automática**: realized é calculado dinamicamente lendo `finance_entries` (filtrando por `product_id` / `service_id` / `client_id` / kind) no mês do objetivo. Cancelamentos/devoluções refletem automaticamente.

## 5. Progresso

Gráficos (recharts):
- Linha diária acumulada (Meta vs Realizado)
- Comparativo mensal do ano
- Ritmo necessário/dia vs ritmo atual
- Projeção e chance de atingir (% baseado em ritmo)

## 6. Histórico

Lista de eventos (`planning_history`) ordenada por data: meta criada/alterada, objetivo criado/removido, objetivo concluído, etc. Inserido por triggers/código no app.

## Versionamento de preços

Já existe `product_price_history` / `service_price_history`. Os objetivos guardam `unit_price_snapshot` no momento da criação para que metas antigas não sejam recalculadas. Metas futuras usam o preço vigente em `effective_date ≤ mês do objetivo`.

## Integração com Dashboard

Em `src/pages/Dashboard.tsx`, substituir o card de meta atual por card inteligente com: Meta, Realizado, Restante, %, Necessário/dia, Projeção, Saúde da meta. Card é clicável e navega para `/faturamento` (Visão Geral).

## Mudanças técnicas

### Banco de dados (uma migration)

Novas tabelas:
- `planning_objectives` — id, user_id, year, month, type ('product'|'service'|'contract'|'other'), product_id?, service_id?, name, target_value, target_quantity, unit_price_snapshot, created_at, updated_at
- `planning_history` — id, user_id, event_type, description, metadata jsonb, created_at
- `monthly_goals_manual` — flag `is_manual` adicionada em `annual_goals` (ou nova tabela `monthly_goals` se necessário). Vou usar a existente `annual_goals` (já é por mês) e adicionar coluna `is_manual boolean default false` + `annual_total numeric` na meta principal.

Todas com RLS por `auth.uid() = user_id`, GRANT a `authenticated` e `service_role`, trigger `updated_at`.

### Arquivos

- **Novo** `src/pages/Planejamento.tsx` (página com tabs)
- **Novos** `src/components/planning/VisaoGeral.tsx`, `MetasAnuais.tsx`, `MetasMensais.tsx`, `Objetivos.tsx`, `Progresso.tsx`, `Historico.tsx`, `ObjectiveDialog.tsx`, `GoalHealthBadge.tsx`
- **Novo** `src/hooks/usePlanning.ts` — carrega objetivos, metas, calcula realizados a partir de `finances`/`clients`
- **Novo** `src/lib/planning.ts` — funções puras: cálculo de saúde, projeção, dicas, distribuição
- **Editado** `src/App.tsx` — rota `/planejamento` apontando para nova página (mantém `/faturamento` como alias)
- **Editado** `src/components/Layout.tsx` (sidebar) — renomear "Faturamento" → "Planejamento e Metas"
- **Editado** `src/pages/Dashboard.tsx` — card de meta inteligente clicável

A identidade visual (cards, bordas, espaçamentos, tipografia, paleta B&W/cinza) é reaproveitada de Dashboard/MetricCard — nenhum novo token de cor.

## Escopo / não-objetivos

- Não altera Caixa, Produtos, Serviços, Clientes (apenas lê dados).
- Não altera identidade visual nem adiciona cores novas.
- Histórico de eventos é gravado a partir das ações do próprio módulo (sem triggers em outras tabelas).
