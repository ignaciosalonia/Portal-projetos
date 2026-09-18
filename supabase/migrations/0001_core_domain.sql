-- Migration 0001: Core Domain
-- Organizations, Memberships, Projects, Project Stages, Environments
-- Princípios: multi-tenancy por organization_id, UUIDs, timestamps, RLS obrigatória.

create extension if not exists "pgcrypto";

-- =========================================================
-- ENUMS
-- =========================================================

create type public.membership_role as enum ('owner', 'admin', 'architect', 'editor');
create type public.project_status as enum ('draft', 'published', 'archived');
create type public.stage_status as enum ('pending', 'current', 'completed');

-- =========================================================
-- ORGANIZATIONS
-- =========================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  website text,
  contact_email text,
  phone text,
  primary_color text,
  secondary_color text,
  accent_color text,
  custom_domain text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.organizations is 'Escritório de arquitetura (tenant). Amanda Arquitetura será a primeira linha, sem tratamento especial no código.';

-- =========================================================
-- MEMBERSHIPS (users <-> organizations)
-- =========================================================
-- Não criamos tabela "users" própria: usamos auth.users (Supabase Auth) e
-- uma tabela de perfil leve + memberships para vincular usuário a organização e papel.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.membership_role not null default 'editor',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

comment on table public.memberships is 'Vínculo usuário-organização com papel. É a única fonte de verdade para autorização multi-tenant (nunca confiar em organization_id vindo do cliente).';

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_organization_id_idx on public.memberships (organization_id);

-- =========================================================
-- PROJECTS
-- =========================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  slug text not null,
  subtitle text,
  description text,
  city text,
  state text,
  country text,
  project_type text,
  hero_image text,
  cover_image text,
  status public.project_status not null default 'draft',
  current_stage_id uuid, -- FK adicionada após criação de project_stages
  start_date date,
  estimated_completion_date date,
  published boolean not null default false,
  public_visibility boolean not null default false,
  seo_indexable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

comment on table public.projects is 'Projeto de arquitetura. Endereço completo NÃO é armazenado aqui (apenas city/state/country) por privacidade.';
comment on column public.projects.published is 'Controla se o projeto está ativo/visível administrativamente.';
comment on column public.projects.public_visibility is 'Controla acesso público via link. Independente de seo_indexable.';
comment on column public.projects.seo_indexable is 'Controla robots/index. Um projeto pode ser público por link e ainda assim noindex.';

create index projects_organization_id_idx on public.projects (organization_id);

-- =========================================================
-- PROJECT STAGES
-- =========================================================

create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  description text,
  order_index integer not null,
  status public.stage_status not null default 'pending',
  start_date date,
  expected_end_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, order_index)
);

alter table public.projects
  add constraint projects_current_stage_id_fkey
  foreign key (current_stage_id) references public.project_stages (id) on delete set null;

create index project_stages_project_id_idx on public.project_stages (project_id);

-- =========================================================
-- ENVIRONMENTS
-- =========================================================

create table public.environments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  order_index integer not null default 0,
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);

create index environments_project_id_idx on public.environments (project_id);

-- =========================================================
-- updated_at TRIGGER (reuso em todas as tabelas mutáveis)
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.project_stages
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.environments
  for each row execute function public.set_updated_at();

-- =========================================================
-- HELPER: papel do usuário autenticado numa organização
-- =========================================================

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
  );
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.projects enable row level security;
alter table public.project_stages enable row level security;
alter table public.environments enable row level security;

-- ---- profiles: cada usuário só vê/edita o próprio perfil ----
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- ---- memberships: usuário vê apenas os próprios vínculos ----
create policy "memberships_select_own" on public.memberships
  for select using (user_id = auth.uid());

-- ---- organizations: membros administram; público lê apenas dados de marca ----
create policy "organizations_select_member" on public.organizations
  for select using (public.is_org_member(id));

create policy "organizations_select_public_branding" on public.organizations
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.organization_id = organizations.id
        and p.published = true
        and p.public_visibility = true
    )
  );

create policy "organizations_update_member" on public.organizations
  for update using (public.is_org_member(id));

create policy "organizations_insert_authenticated" on public.organizations
  for insert with check (auth.uid() is not null);

-- ---- projects: membros administram tudo da própria organização ----
create policy "projects_all_member" on public.projects
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- ---- projects: acesso público somente a projetos publicados e visíveis ----
create policy "projects_select_public" on public.projects
  for select
  using (published = true and public_visibility = true);

-- ---- project_stages: seguem a organização do projeto pai ----
create policy "project_stages_all_member" on public.project_stages
  for all
  using (public.is_org_member((select organization_id from public.projects where id = project_stages.project_id)))
  with check (public.is_org_member((select organization_id from public.projects where id = project_stages.project_id)));

create policy "project_stages_select_public" on public.project_stages
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_stages.project_id
        and p.published = true
        and p.public_visibility = true
    )
  );

-- ---- environments: mesma lógica de projects ----
create policy "environments_all_member" on public.environments
  for all
  using (public.is_org_member((select organization_id from public.projects where id = environments.project_id)))
  with check (public.is_org_member((select organization_id from public.projects where id = environments.project_id)));

create policy "environments_select_public" on public.environments
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = environments.project_id
        and p.published = true
        and p.public_visibility = true
    )
  );
