-- Migration 0008: Link público com token e controle de acesso
--
-- Problema: o endereço público era derivado do nome do projeto
-- (/p/<org>/apartamento-petropolis). Quem recebesse um link descobria o
-- padrão e podia tentar nomes prováveis até acertar o projeto de outro
-- cliente — nomes de projeto de arquitetura são previsíveis (bairro,
-- sobrenome, tipo de imóvel).
--
-- Solução: o acesso passa a exigir um token aleatório no endereço. O slug
-- continua existindo por legibilidade, mas sozinho não abre nada.
--
-- Junto vêm os controles de ciclo de vida do link, que faltavam:
--   public_access_enabled  desligar sem despublicar o projeto
--   public_access_expires_at  o link para de valer sozinho
--   (regenerar = gravar um novo public_token)

create extension if not exists pgcrypto;

alter table public.projects
  add column public_token text,
  add column public_access_enabled boolean not null default true,
  add column public_access_expires_at timestamptz,
  add column public_opened_count integer not null default 0,
  add column public_last_opened_at timestamptz;

comment on column public.projects.public_token is 'Trecho aleatório exigido no endereço público. Sem ele o projeto não abre.';
comment on column public.projects.public_access_enabled is 'Permite pausar o link sem alterar published/public_visibility.';
comment on column public.projects.public_access_expires_at is 'Data em que o link deixa de funcionar. Nulo = sem prazo.';
comment on column public.projects.public_opened_count is 'Quantas vezes a página pública foi aberta.';
comment on column public.projects.public_last_opened_at is 'Última abertura da página pública.';

-- Gera token para os projetos que já existem. 18 bytes em base64url dão
-- cerca de 10^43 combinações — inviável de varrer por tentativa.
update public.projects
set public_token = replace(replace(encode(gen_random_bytes(18), 'base64'), '/', '_'), '+', '-')
where public_token is null;

alter table public.projects
  alter column public_token set not null;

create unique index projects_public_token_key on public.projects (public_token);

-- Todo projeto novo nasce com token próprio.
alter table public.projects
  alter column public_token
  set default replace(replace(encode(gen_random_bytes(18), 'base64'), '/', '_'), '+', '-');

-- A leitura pública passa a exigir, além de publicado e visível, que o
-- acesso esteja ligado e dentro do prazo. A checagem do token acontece na
-- aplicação: a policy não enxerga o endereço pedido.
drop policy if exists "projects_select_public" on public.projects;

create policy "projects_select_public" on public.projects
  for select
  using (
    published = true
    and public_visibility = true
    and public_access_enabled = true
    and (public_access_expires_at is null or public_access_expires_at > now())
  );

-- Contador de aberturas. SECURITY DEFINER porque o visitante é anônimo e
-- não pode receber permissão de UPDATE na tabela; a função só incrementa
-- os dois campos de telemetria, nada mais.
create or replace function public.register_public_view(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects
  set public_opened_count = public_opened_count + 1,
      public_last_opened_at = now()
  where public_token = p_token
    and published = true
    and public_visibility = true
    and public_access_enabled = true
    and (public_access_expires_at is null or public_access_expires_at > now());
end;
$$;

grant execute on function public.register_public_view(text) to anon, authenticated;

-- Gera um token novo, invalidando o anterior. Fica no banco (e não na
-- aplicação) para que o valor aleatório nunca venha do cliente.
create or replace function public.regenerate_public_token(p_project_id uuid)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_token text;
begin
  v_token := replace(replace(encode(gen_random_bytes(18), 'base64'), '/', '_'), '+', '-');

  update public.projects
  set public_token = v_token
  where id = p_project_id;

  return v_token;
end;
$$;

grant execute on function public.regenerate_public_token(uuid) to authenticated;
