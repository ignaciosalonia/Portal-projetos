-- Migration 0005: Zonas de ambiente + especificações (materiais/produtos)
--
-- zone: categoria livre do ambiente (ex.: "Área Social", "Área Privada",
-- "Área de Serviço") — usada como eyebrow acima do nome do ambiente,
-- padrão observado no material de referência (Senna Building).
--
-- specification_items: implementa a decisão já registrada em ADR-004
-- (docs/DECISIONS.md) — materials e products unificados em uma única
-- tabela com coluna `kind`, em vez de duas tabelas quase idênticas.

alter table public.environments
  add column zone text;

create type public.specification_kind as enum ('material', 'product');

create table public.specification_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  environment_id uuid references public.environments (id) on delete set null,
  kind public.specification_kind not null,
  name text not null,
  brand text,
  category text,
  description text,
  external_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.specification_items is 'Materiais e produtos especificados, opcionalmente associados a um ambiente. Ver ADR-004.';

create index specification_items_project_id_idx on public.specification_items (project_id);
create index specification_items_environment_id_idx on public.specification_items (environment_id);

alter table public.specification_items enable row level security;

create policy "specification_items_all_member" on public.specification_items
  for all
  using (public.is_org_member((select organization_id from public.projects where id = specification_items.project_id)))
  with check (public.is_org_member((select organization_id from public.projects where id = specification_items.project_id)));

create policy "specification_items_select_public" on public.specification_items
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = specification_items.project_id
        and p.published = true
        and p.public_visibility = true
    )
  );

-- GRANT de nível de tabela (ver ADR-007 — obrigatório, RLS sozinha não basta).
grant select on public.specification_items to anon, authenticated;
grant insert, update, delete on public.specification_items to authenticated;
