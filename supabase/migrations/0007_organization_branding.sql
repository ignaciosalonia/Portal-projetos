-- Migration 0007: Identidade visual por organização
--
-- Até aqui a marca (nome, cores, tipografia) estava fixa no código do
-- microsite — servia para o primeiro escritório, mas impedia a plataforma
-- de atender um segundo. Estes campos movem a identidade para o cadastro
-- da organização.
--
-- As colunas de cor que já existiam ganham papel explícito:
comment on column public.organizations.primary_color is 'Cor do texto principal (ex.: #252828).';
comment on column public.organizations.secondary_color is 'Cor de texto secundário (ex.: #767c71).';
comment on column public.organizations.accent_color is 'Cor de destaque: rótulos, traços e ícones (ex.: #ad997a).';

alter table public.organizations
  add column background_color text,
  add column surface_color text,
  add column font_pair text not null default 'classico',
  add column tagline text,
  add column show_powered_by boolean not null default true;

comment on column public.organizations.background_color is 'Cor de fundo das seções claras (ex.: #f3efed).';
comment on column public.organizations.surface_color is 'Cor dos blocos alternados e bordas (ex.: #b7ada1).';
comment on column public.organizations.font_pair is 'Par tipográfico escolhido entre as opções curadas (ver src/lib/branding.ts).';
comment on column public.organizations.tagline is 'Linha de apoio sob o nome, no rodapé do microsite.';
comment on column public.organizations.show_powered_by is 'Exibe o selo do parceiro de distribuição no rodapé, quando configurado.';

-- Preenche o escritório existente com a identidade que já estava no código,
-- para que nada mude visualmente após esta migration.
update public.organizations
set primary_color    = coalesce(primary_color,    '#252828'),
    secondary_color  = coalesce(secondary_color,  '#767c71'),
    accent_color     = coalesce(accent_color,     '#ad997a'),
    background_color = coalesce(background_color, '#f3efed'),
    surface_color    = coalesce(surface_color,    '#b7ada1'),
    tagline          = coalesce(tagline, 'Arquitetura & Interiores'),
    font_pair        = 'classico'
where slug = 'amanda-arquitetura';
