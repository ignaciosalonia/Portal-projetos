# Modelo de Dados

## Implementado (Milestone 1) — `supabase/migrations/0001_core_domain.sql`

- `organizations`
- `profiles` (perfil leve vinculado a `auth.users`)
- `memberships` (user × organization × role — fonte única de autorização)
- `projects`
- `project_stages`
- `environments`

## Planejado (Milestones futuros — ainda não criado)

- `media` (Milestone 4)
- `materials` e `products` (Milestone 5)
- `documents` (Milestone 5)
- `project_updates` + `project_update_media` (Milestone 5)

## Decisões de modelagem que se afastam do rascunho original

### 1. Não existe tabela `users` própria

O rascunho pedia uma tabela `users`. Usamos `auth.users` (gerenciada pelo
Supabase Auth) + `profiles` (dados de perfil) + `memberships` (organização
e papel). Motivo: evita duplicar autenticação, e é o padrão recomendado
pelo Supabase para RLS baseada em `auth.uid()`.

### 2. `memberships` em vez de `organization_id` direto no usuário

Um usuário pode pertencer a mais de uma organização (ex.: um freelancer que
atende dois escritórios) sem exigir isso agora. A tabela associativa custa
pouco e evita uma migração dolorosa depois.

### 3. `materials` e `products` — decisão adiada, recomendação registrada

Ambos compartilham quase todos os campos (`name`, `brand`, `model`,
`description`, `image`, `external_url`, `category`, `order_index`).
Recomendação: quando implementados (Milestone 5), usar uma única tabela
`specification_items` com uma coluna `kind` (`material` | `product`) em vez
de duas tabelas quase idênticas — reduz duplicação de RLS, índices e
repositórios. Ver ADR-004.

### 4. `media` como tabela única, não polimórfica "livre"

Recomendação para Milestone 4: uma tabela `media` com `project_id`,
`environment_id` opcional, `type` (enum: `render`, `photo`, `video`,
`construction_photo`, `reference`), `storage_path`, `order_index`. Evitar
uma estrutura polimórfica genérica (`entity_type` + `entity_id` livres) — o
número de entidades que precisam de mídia é pequeno e conhecido; a
polimorfia genérica sacrifica integridade referencial sem necessidade real.

### 5. Sem endereço completo

`projects` armazena apenas `city`, `state`, `country`. Endereço completo,
se necessário internamente, deve ficar em uma tabela separada não exposta
via RLS pública — não implementada agora por não haver requisito.

### 6. Enums de status via `enum` do Postgres, não texto livre

`project_status`, `stage_status` e `membership_role` são `enum` nativos —
evita strings arbitrárias e erros de digitação silenciosos, com custo de
migração baixo caso surjam novos valores (`ALTER TYPE ... ADD VALUE`).

## Índices e constraints relevantes

- `organizations.slug` — `unique`
- `organizations.custom_domain` — `unique`
- `projects (organization_id, slug)` — `unique` (slug único por organização,
  não globalmente)
- `project_stages (project_id, order_index)` — `unique`
- `environments (project_id, slug)` — `unique`
- Todas as FKs para `project_id`/`organization_id` possuem índice.
