-- Migration 0004: Media
-- Suporta múltiplas imagens por projeto/ambiente (moodboard, plantas, renders,
-- fotos de obra, documentos). Substitui a limitação de "1 imagem por
-- ambiente" que existia em environments.cover_image.

create type public.media_type as enum (
  'moodboard',
  'floor_plan',
  'render',
  'photo',
  'construction_photo',
  'reference',
  'document'
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  environment_id uuid references public.environments (id) on delete set null,
  type public.media_type not null,
  url text not null,
  title text,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.media is 'Galeria de mídia de um projeto. environment_id é opcional: null para itens de nível de projeto (moodboard, planta baixa, documentos gerais).';

create index media_project_id_idx on public.media (project_id);
create index media_environment_id_idx on public.media (environment_id);

-- RLS: mesma lógica de environments (membros administram; público lê
-- apenas de projetos publicados e visíveis).
alter table public.media enable row level security;

create policy "media_all_member" on public.media
  for all
  using (public.is_org_member((select organization_id from public.projects where id = media.project_id)))
  with check (public.is_org_member((select organization_id from public.projects where id = media.project_id)));

create policy "media_select_public" on public.media
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = media.project_id
        and p.published = true
        and p.public_visibility = true
    )
  );

-- GRANT de nível de tabela (ver ADR-007 — RLS sozinha não é suficiente).
grant select on public.media to anon, authenticated;
grant insert, update, delete on public.media to authenticated;
