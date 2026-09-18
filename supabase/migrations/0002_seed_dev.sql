-- Seed de desenvolvimento — NÃO aplicar em produção.
-- Cria uma organização de exemplo ("Amanda Arquitetura") e um projeto fictício,
-- sem dados pessoais reais, apenas para validar o modelo e a experiência pública.

insert into public.organizations (name, slug, description, primary_color, secondary_color, accent_color)
values (
  'Amanda Arquitetura',
  'amanda-arquitetura',
  'Escritório de arquitetura e interiores.',
  '#1C1C1A',
  '#F5F1EA',
  '#B08968'
)
on conflict (slug) do nothing;

insert into public.projects (
  organization_id, name, slug, subtitle, description,
  city, state, country, project_type, status,
  published, public_visibility, seo_indexable
)
select
  o.id, 'Casa Exemplo', 'casa-exemplo', 'Uma casa de praia contemporânea',
  'Projeto fictício utilizado para validar o modelo de dados e a experiência pública do microsite.',
  'Florianópolis', 'SC', 'BR', 'residencial', 'draft',
  false, false, false
from public.organizations o
where o.slug = 'amanda-arquitetura'
on conflict (organization_id, slug) do nothing;

insert into public.project_stages (project_id, name, order_index, status)
select p.id, stage.name, stage.order_index, stage.status
from public.projects p
cross join (
  values
    ('Briefing', 1, 'completed'::public.stage_status),
    ('Estudo preliminar', 2, 'completed'::public.stage_status),
    ('Layout', 3, 'current'::public.stage_status),
    ('Projeto executivo', 4, 'pending'::public.stage_status),
    ('Modelagem 3D', 5, 'pending'::public.stage_status),
    ('Orçamentação', 6, 'pending'::public.stage_status),
    ('Execução', 7, 'pending'::public.stage_status),
    ('Entrega', 8, 'pending'::public.stage_status)
) as stage(name, order_index, status)
where p.slug = 'casa-exemplo'
on conflict (project_id, order_index) do nothing;

insert into public.environments (project_id, name, slug, order_index)
select p.id, env.name, env.slug, env.order_index
from public.projects p
cross join (
  values
    ('Living', 'living', 1),
    ('Cozinha', 'cozinha', 2),
    ('Suíte', 'suite', 3)
) as env(name, slug, order_index)
where p.slug = 'casa-exemplo'
on conflict (project_id, slug) do nothing;

-- Nota: a criação de um usuário owner/membership de exemplo depende de um
-- usuário existente em auth.users (criado via Supabase Auth). Após o primeiro
-- signup, inserir manualmente:
--   insert into public.memberships (organization_id, user_id, role)
--   select o.id, '<auth_user_id>', 'owner' from public.organizations o
--   where o.slug = 'amanda-arquitetura';
