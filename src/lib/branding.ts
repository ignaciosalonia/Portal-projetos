import type { CSSProperties } from "react";
import type { Organization } from "@/domain/types";

/**
 * Pares de fontes disponíveis para os escritórios. A lista é curada de
 * propósito: todos os pares foram escolhidos para funcionar na capa em
 * tamanho grande e em textos corridos pequenos. Para adicionar um par,
 * basta incluí-lo aqui — não exige migration.
 */
export const FONT_PAIRS = {
  classico: {
    label: "Clássico editorial",
    heading: "Playfair Display",
    body: "DM Sans",
    families: "family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;700",
  },
  elegante: {
    label: "Elegante",
    heading: "Cormorant Garamond",
    body: "Jost",
    families: "family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@400;500;600",
  },
  contemporaneo: {
    label: "Contemporâneo",
    heading: "Fraunces",
    body: "Inter",
    families: "family=Fraunces:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600",
  },
  moderno: {
    label: "Moderno (sem serifa)",
    heading: "Manrope",
    body: "Manrope",
    families: "family=Manrope:wght@400;500;600;700",
  },
  arquitetonico: {
    label: "Arquitetônico",
    heading: "Marcellus",
    body: "Lato",
    families: "family=Marcellus&family=Lato:wght@400;700",
  },
} as const;

export type FontPairKey = keyof typeof FONT_PAIRS;

export const FONT_PAIR_KEYS = Object.keys(FONT_PAIRS) as FontPairKey[];

export function isFontPairKey(value: string): value is FontPairKey {
  return value in FONT_PAIRS;
}

export function fontPairHref(key: FontPairKey): string {
  return `https://fonts.googleapis.com/css2?${FONT_PAIRS[key].families}&display=swap`;
}

/** Uma única folha com todos os pares — usada na pré-visualização do painel. */
export function allFontPairsHref(): string {
  const families = FONT_PAIR_KEYS.map((k) => FONT_PAIRS[k].families).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/** Valores usados quando a organização ainda não definiu os seus. */
export const DEFAULT_COLORS = {
  background: "#f3efed",
  primary: "#252828",
  secondary: "#767c71",
  accent: "#ad997a",
  surface: "#b7ada1",
} as const;

export interface ResolvedBrand {
  displayName: string;
  tagline: string | null;
  logoUrl: string | null;
  fontPair: FontPairKey;
  fontHref: string;
  showPoweredBy: boolean;
  /** Variáveis CSS a aplicar no elemento raiz do microsite. */
  style: CSSProperties;
}

/**
 * Converte o cadastro da organização nas variáveis de tema do microsite.
 * As classes do site (bg-brand-cream, text-brand-camel, font-serif...)
 * leem essas variáveis, então sobrescrevê-las na raiz troca a identidade
 * inteira sem tocar em nenhum componente.
 */
export function resolveBrand(org: Organization): ResolvedBrand {
  const fontPair: FontPairKey = isFontPairKey(org.fontPair)
    ? org.fontPair
    : "classico";
  const pair = FONT_PAIRS[fontPair];

  const style = {
    "--brand-cream": org.backgroundColor ?? DEFAULT_COLORS.background,
    "--brand-charcoal": org.primaryColor ?? DEFAULT_COLORS.primary,
    "--brand-sage": org.secondaryColor ?? DEFAULT_COLORS.secondary,
    "--brand-camel": org.accentColor ?? DEFAULT_COLORS.accent,
    "--brand-greige": org.surfaceColor ?? DEFAULT_COLORS.surface,
    "--brand-font-heading": `"${pair.heading}"`,
    "--brand-font-body": `"${pair.body}"`,
  } as CSSProperties;

  return {
    displayName: org.name,
    tagline: org.tagline,
    logoUrl: org.logoUrl,
    fontPair,
    fontHref: fontPairHref(fontPair),
    showPoweredBy: org.showPoweredBy,
    style,
  };
}

/**
 * Selo do parceiro de distribuição. É configuração da plataforma, não de
 * cada escritório — por isso vem de variável de ambiente. Sem a variável,
 * o selo não aparece em lugar nenhum.
 */
export function poweredBy(): { label: string; url: string | null } | null {
  const label = process.env.NEXT_PUBLIC_POWERED_BY_LABEL?.trim();
  if (!label) return null;
  const url = process.env.NEXT_PUBLIC_POWERED_BY_URL?.trim() || null;
  return { label, url };
}
