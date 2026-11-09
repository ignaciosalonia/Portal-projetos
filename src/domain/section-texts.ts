/**
 * Textos editáveis do microsite.
 *
 * Cada projeto guarda em `projects.section_texts` só o que foi alterado; o que
 * não estiver lá usa o padrão abaixo. Campo salvo em branco = elemento some
 * do site (escolha da arquiteta). Quebras de linha nos títulos são mantidas.
 */

export interface SectionTextField {
  key: string;
  label: string;
  default: string;
  multiline?: boolean;
  hint?: string;
}

export type SectionGroup =
  | "capa"
  | "apresentacao"
  | "ambientes"
  | "tecnico"
  | "percurso";

export const SECTION_TEXT_FIELDS: Record<SectionGroup, SectionTextField[]> = {
  capa: [
    {
      key: "capa_dica",
      label: "Dica no rodapé da capa",
      default: "deslize para explorar",
    },
  ],
  apresentacao: [
    { key: "apresentacao_rotulo", label: "Rótulo", default: "Apresentação" },
    {
      key: "apresentacao_titulo",
      label: "Título",
      default: "O projeto e\nsua atmosfera.",
      multiline: true,
      hint: "Use Enter para quebrar a linha.",
    },
    {
      key: "apresentacao_legenda",
      label: "Legenda da imagem",
      default: "Moodboard · linguagem material e cromática do projeto",
    },
    {
      key: "materiais_gerais_rotulo",
      label: "Título da lista de materiais gerais",
      default: "Materiais e equipamentos gerais",
    },
  ],
  ambientes: [
    { key: "transicao_rotulo", label: "Rótulo", default: "Percurso pelo projeto" },
    {
      key: "transicao_titulo",
      label: "Título",
      default: "Ambiente a\nambiente.",
      multiline: true,
      hint: "Use Enter para quebrar a linha.",
    },
    {
      key: "transicao_texto",
      label: "Texto",
      default:
        "A sequência acompanha o percurso natural pelo espaço, das áreas comuns às mais reservadas.",
      multiline: true,
    },
    {
      key: "materiais_ambiente_rotulo",
      label: "Título da lista de materiais de cada ambiente",
      default: "Materiais e equipamentos considerados",
    },
  ],
  tecnico: [
    { key: "tecnico_rotulo", label: "Rótulo", default: "Desenhos técnicos" },
    {
      key: "tecnico_titulo",
      label: "Título",
      default: "Os detalhes para\nalém do render.",
      multiline: true,
      hint: "Use Enter para quebrar a linha.",
    },
    {
      key: "tecnico_texto",
      label: "Texto",
      default:
        "O desenvolvimento visual é acompanhado por desenho técnico de layout, cortes, carpintarias e iluminação.",
      multiline: true,
    },
  ],
  percurso: [
    { key: "percurso_rotulo", label: "Rótulo", default: "Percurso" },
    {
      key: "percurso_titulo",
      label: "Título",
      default: "O percurso até aqui\ne o que se segue.",
      multiline: true,
      hint: "Use Enter para quebrar a linha.",
    },
  ],
};

/** Chave que guarda a imagem escolhida para o bloco de apresentação. */
export const APRESENTACAO_IMAGEM_KEY = "apresentacao_imagem_id";

const DEFAULTS: Record<string, string> = Object.fromEntries(
  Object.values(SECTION_TEXT_FIELDS)
    .flat()
    .map((f) => [f.key, f.default]),
);

export const ALL_SECTION_TEXT_KEYS = new Set([
  ...Object.keys(DEFAULTS),
  APRESENTACAO_IMAGEM_KEY,
]);

/** Texto salvo do projeto, ou o padrão se nunca foi editado. */
export function sectionText(
  texts: Record<string, string> | null | undefined,
  key: string,
): string {
  const saved = texts?.[key];
  return saved !== undefined ? saved : (DEFAULTS[key] ?? "");
}
