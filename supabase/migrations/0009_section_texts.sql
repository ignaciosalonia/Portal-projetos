-- 0009_section_texts.sql — Textos editáveis do microsite, por projeto
--
-- Rótulos, títulos e textos de cada seção (antes fixos no código) e a imagem
-- do bloco de apresentação. Um único campo jsonb: chave ausente = usa o texto
-- padrão definido em src/domain/section-texts.ts, então os projetos que já
-- existem continuam iguais até alguém editar.
-- Idempotente.

alter table public.projects
  add column if not exists section_texts jsonb not null default '{}'::jsonb;
