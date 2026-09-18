# Registro de Decisões Arquiteturais (ADRs)

## ADR-001 — Supabase como infraestrutura inicial

**Contexto:** necessidade de banco relacional, autenticação e storage sem
operar infraestrutura própria no MVP.
**Decisão:** PostgreSQL + Auth + Storage via Supabase.
**Motivo:** RLS nativa do Postgres resolve multi-tenancy com segurança no
nível do banco (não apenas na aplicação); Auth integrada evita reescrever
gestão de sessão; custo e complexidade operacional baixos para o estágio
atual.
**Consequências:** acoplamento a APIs específicas do Supabase na camada de
persistência (`src/lib/supabase`) — isolado do domínio, então uma futura
migração de provedor afeta apenas essa camada.

## ADR-002 — Autorização via RLS + `memberships`, nunca via `organization_id` do cliente

**Contexto:** requisito explícito de isolamento total entre organizações.
**Decisão:** toda política de RLS resolve a organização do usuário via
`auth.uid()` → `memberships`, nunca aceita `organization_id` vindo do
payload como fonte de verdade.
**Motivo:** elimina uma classe inteira de vulnerabilidades de IDOR
(Insecure Direct Object Reference) por construção, no nível do banco.
**Consequências:** toda nova tabela de domínio precisa de uma policy
espelhando esse padrão — documentado em `DATA_MODEL.md` e nas próprias
migrations.

## ADR-003 — Sem tabela `users` própria

**Contexto:** rascunho original previa uma tabela `users`.
**Decisão:** usar `auth.users` (Supabase Auth) + `profiles` + `memberships`.
**Motivo:** evita duplicar autenticação; é o padrão suportado nativamente
por RLS via `auth.uid()`.
**Consequências:** qualquer dado de perfil adicional vai em `profiles`, não
em uma tabela `users` paralela.

## ADR-004 — `materials`/`products`: decisão adiada para o Milestone 5

**Contexto:** ambas as entidades do rascunho compartilham quase todos os
campos.
**Decisão registrada, implementação pendente:** unificar em
`specification_items` com coluna `kind`.
**Motivo:** reduz duplicação de schema, RLS e repositórios sem perda de
expressividade (a diferença é puramente de categorização).
**Consequências:** ao chegar no Milestone 5, criar `specification_items` em
vez de duas tabelas — revisar este ADR se surgir um campo genuinamente
exclusivo de um dos dois tipos.

## ADR-006 — Sem fluxo de convite/onboarding no Milestone 2 (decisão pendente)

**Contexto:** a tabela `memberships` (ADR-002) não possui política de RLS
para `insert`/`update`/`delete` — de propósito, para que um usuário nunca
possa se autoconceder acesso a uma organização.
**Decisão:** no MVP, o primeiro vínculo (owner) de cada organização é
criado manualmente via SQL Editor do Supabase (com privilégio de
`postgres`/service role), não pela aplicação.
**Motivo:** evitar construir uma tela de convite de usuários — haveria só
um único caso de uso real (a própria Amanda) e I) não há requisito
explícito para múltiplos administradores ainda, II) uma tela mal desenhada
de convite é superfície de ataque desnecessária neste estágio.
**Consequências:** antes de nova organização real usar o produto (fora do
MVP com um único cliente), será necessário implementar uma tela de convite
com política de RLS específica (ex.: apenas `owner`/`admin` pode inserir
`memberships` na própria organização) — registrar como item do
Milestone 2 estendido ou Milestone 6.

## ADR-005 — Next.js 16 (Active LTS) em vez de Next.js 15

**Contexto:** o prompt não fixou versão; instruiu confirmar a mais atual
antes de iniciar.
**Decisão:** Next.js 16.3.5, confirmado como Active LTS em 16/09/2026 (fim
de suporte projetado para 22/10/2027), com React 19.2.8 e Tailwind CSS v4.
**Motivo:** é a linha ativa recomendada pela Vercel; Next.js 15 está em
Maintenance LTS com fim de vida em 21/10/2026.
**Consequências:** nenhuma migração de versão major necessária no curto
prazo do projeto.

## ADR-007 — GRANT explícito de nível de tabela para anon/authenticated

**Contexto:** após aplicar RLS corretamente (ADR-002), todas as consultas
autenticadas ao painel administrativo falhavam com `permission denied for
table X`, mesmo com policies corretas e o vínculo (membership) existindo.
**Causa raiz:** tabelas criadas via SQL puro (SQL Editor) não recebem
automaticamente os `GRANT` de nível de tabela para os papéis `anon` e
`authenticated` — diferente do que acontece ao criar tabelas pela UI
(Table Editor) do Supabase, que concede privilégios básicos por padrão.
RLS restringe **linhas**; o `GRANT` de tabela é um portão anterior e
independente — sem ele, a policy nunca chega a ser avaliada.
**Decisão:** toda migration que cria uma tabela nova deve **sempre**
incluir os `GRANT`s correspondentes para `anon`/`authenticated` (ver
`supabase/migrations/0003_grants.sql`), na mesma migration ou logo em
seguida — nunca assumir que o Supabase concede isso automaticamente
quando o schema é gerenciado via SQL/CLI.
**Consequências:** ao criar `media`, `materials`/`specification_items`,
`documents` e `project_updates` (Milestones 4 e 5), replicar o padrão:
RLS + policies + GRANT explícito, sempre os três juntos.

## ADR-008 — specification_items implementa a unificação prevista no ADR-004

**Contexto:** análise do material de referência (Senna Building) confirmou
a necessidade de um catálogo de materiais/produtos por ambiente, com nome,
marca, categoria/aplicação e link externo, exibido em acordeão retrátil.
**Decisão:** implementar exatamente como registrado no ADR-004 — tabela
única `specification_items` com coluna `kind` (`material` | `product`),
em vez de duas tabelas. `environment_id` opcional permite itens de nível
de projeto (ex.: acabamentos gerais) além dos itens por ambiente.
**Consequências:** UI de administração (formulário de criação/edição de
specification_items) ainda não construída — hoje só populável via SQL,
mesma situação transitória de `media` antes do Milestone 4.

## ADR-009 — campo `zone` em environments (categoria/setor do ambiente)

**Contexto:** o material de referência agrupa ambientes por zona
("Área Social", "Área Privada", "Área de Serviço") como um eyebrow acima
do nome do ambiente — uma camada de categorização que `environments` não
tinha.
**Decisão:** adicionar `environments.zone` como texto livre (não enum) —
cada escritório pode nomear zonas à sua maneira; validação de vocabulário
fica para uma iteração futura caso vire necessidade real.
**Consequências:** campo opcional, projetos existentes continuam
funcionando sem ele (eyebrow simplesmente não aparece).
