# Portal de Projetos — Plataforma de Microsites para Escritórios de Arquitetura

Plataforma multi-tenant que gera microsites públicos e sofisticados para
projetos de arquitetura, com painel administrativo para os escritórios.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
Supabase (Postgres + Auth + Storage) · Vercel.

## Como rodar localmente

\`\`\`bash
npm install
cp .env.example .env.local   # preencher com as chaves do projeto Supabase
npm run dev
\`\`\`

## Banco de dados

As migrations vivem em \`supabase/migrations/\`, aplicadas via
[Supabase CLI](https://supabase.com/docs/guides/cli) ou pelo painel do
Supabase. \`0002_seed_dev.sql\` cria dados fictícios de desenvolvimento e
**não deve ser aplicado em produção**.

## Documentação

- \`docs/ARCHITECTURE.md\` — visão arquitetural e camadas.
- \`docs/DATA_MODEL.md\` — modelo de dados e decisões de modelagem.
- \`docs/INTEGRATIONS.md\` — plano de integração futura com CRMs externos.
- \`docs/DECISIONS.md\` — ADRs.

## Scripts

- \`npm run dev\` — ambiente de desenvolvimento.
- \`npm run build\` — build de produção.
- \`npm run lint\` — ESLint.
- \`npm run typecheck\` — verificação de tipos sem emitir arquivos.

## Estado atual

Milestone 0 (fundação) e Milestone 1 (domínio core: organizations,
memberships, projects, project stages, environments) implementados. Ver
\`docs/DECISIONS.md\` e o histórico de commits para detalhes.
