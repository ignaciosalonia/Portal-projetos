-- Migration 0003: Grants de nível de tabela
--
-- RLS (0001) restringe LINHAS, mas o Postgres exige separadamente um GRANT
-- de nível de TABELA para os papéis anon/authenticated antes de a RLS
-- sequer ser avaliada. Tabelas criadas via SQL puro (SQL Editor) não
-- recebem esses grants automaticamente — diferente do que acontece ao
-- criar tabelas pelo Table Editor da UI do Supabase.
--
-- Sem isso, toda consulta falha com "permission denied for table X" antes
-- de qualquer policy rodar.

grant usage on schema public to anon, authenticated;

-- organizations: leitura pública (branding de projetos publicados) e de
-- membros; escrita apenas para autenticados (RLS restringe à própria org).
grant select on public.organizations to anon, authenticated;
grant insert, update on public.organizations to authenticated;

-- profiles: cada usuário só enxerga/edita o próprio (RLS já restringe).
grant select, insert, update on public.profiles to authenticated;

-- memberships: somente leitura do próprio vínculo (RLS restringe).
-- Sem policy de insert/update/delete de propósito (ver ADR-006) — o
-- vínculo inicial é criado via SQL Editor por um administrador.
grant select on public.memberships to authenticated;

-- projects: leitura pública de projetos publicados+visíveis; CRUD completo
-- para membros da organização (RLS restringe em ambos os casos).
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

-- project_stages: mesma lógica de projects.
grant select on public.project_stages to anon, authenticated;
grant insert, update, delete on public.project_stages to authenticated;

-- environments: mesma lógica de projects.
grant select on public.environments to anon, authenticated;
grant insert, update, delete on public.environments to authenticated;
