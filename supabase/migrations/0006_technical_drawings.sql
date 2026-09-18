-- Migration 0006: Desenhos técnicos (código + PDF)
--
-- Padrão observado no material de referência: cada desenho técnico é um
-- card com código da prancha (ex.: "ARQ-03"), título, miniatura e link
-- que abre o arquivo — normalmente um PDF, não uma imagem.
--
-- `code`: código da prancha, exibido acima do título no card.
-- `file_url`: arquivo real a abrir (PDF). Quando presente, `url` é usado
--   apenas como miniatura de pré-visualização.

alter table public.media
  add column code text,
  add column file_url text;

comment on column public.media.code is 'Código da prancha técnica (ex.: ARQ-03). Usado em media do tipo document.';
comment on column public.media.file_url is 'Arquivo a abrir ao clicar (PDF). Quando nulo, `url` é usado diretamente.';
