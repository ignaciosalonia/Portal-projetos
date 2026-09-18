# Arquitetura

## Visão geral

Plataforma multi-tenant que gera microsites públicos para projetos de
arquitetura. Um único código-base atende N organizações (escritórios); a
Amanda Arquitetura é apenas a primeira linha na tabela `organizations`, sem
nenhum tratamento especial no código-fonte.

```
Organization (1) ──< Project (N) ──< ProjectStage (N)
                                 ├──< Environment (N)
                                 ├──< Media (N)            [Milestone 4]
                                 ├──< Material / Product   [Milestone 5]
                                 ├──< Document             [Milestone 5]
                                 └──< ProjectUpdate        [Milestone 5]
```

## Camadas

1. **Apresentação** (`src/app`) — rotas Next.js (App Router). Dois grupos:
   - `src/app/p/[orgSlug]/[projectSlug]` — microsite público, sem login.
   - `src/app/admin/...` — painel administrativo, autenticado.
2. **Domínio** (`src/domain`) — tipos e regras que independem de Supabase.
   Nenhum componente importa tipos do SDK do Supabase diretamente.
3. **Persistência** (`src/lib/repositories`, `src/lib/supabase`) — únicos
   pontos que falam com o banco. Mapeiam linhas (snake_case) para os tipos
   de domínio (camelCase).
4. **Integrações** (`/integrations`, futuro) — adapters para sistemas
   externos (ver `INTEGRATIONS.md`). Não implementado neste momento.

## Multi-tenancy e autorização

- Toda tabela de domínio carrega `organization_id` (diretamente ou via
  `project_id`).
- **Nunca confiamos em `organization_id` enviado pelo cliente.** A
  autorização é sempre resolvida no banco via Row Level Security, usando
  `auth.uid()` contra a tabela `memberships`.
- Acesso público (sem login) é liberado apenas onde `published = true AND
  public_visibility = true`, também via RLS — o código da aplicação não
  reimplementa essa regra em nenhuma camada.

## Visibilidade pública vs. indexação

`public_visibility` (acessível por link) e `seo_indexable` (permitido no
Google) são campos independentes. Um projeto pode ser público por link e
`noindex` ao mesmo tempo.

## Stack e decisões

Ver `docs/DECISIONS.md` para os ADRs. Resumo:

| Camada | Escolha | Versão confirmada em 16/09/2026 |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.5 (Active LTS) |
| UI | React | 19.2.8 |
| Linguagem | TypeScript | 5.x (strict) |
| Estilo | Tailwind CSS | v4 |
| Banco | PostgreSQL via Supabase | — |
| Auth | Supabase Auth | `@supabase/ssr` |
| Storage | Supabase Storage | Milestone 4 |
| Deploy | Vercel | — |

## Preparação para API e integrações futuras

A camada de persistência já isola o acesso ao banco; expor
`/api/v1/projects` no futuro (Milestone 7) significa adicionar Route
Handlers que chamam os mesmos repositórios — não uma reescrita.
