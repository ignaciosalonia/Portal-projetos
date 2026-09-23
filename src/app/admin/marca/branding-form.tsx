"use client";

import { useActionState, useState, useTransition } from "react";
import type { Organization } from "@/domain/types";
import {
  FONT_PAIRS,
  FONT_PAIR_KEYS,
  DEFAULT_COLORS,
  allFontPairsHref,
  type FontPairKey,
} from "@/lib/branding";
import {
  removeLogoAction,
  updateBrandingAction,
  uploadLogoAction,
  type FormActionState,
} from "./actions";

const initialState: FormActionState = { error: null };

const COLOR_FIELDS = [
  {
    name: "backgroundColor",
    label: "Fundo",
    hint: "Cor base das seções claras",
    fallback: DEFAULT_COLORS.background,
  },
  {
    name: "primaryColor",
    label: "Texto principal",
    hint: "Títulos e textos de destaque",
    fallback: DEFAULT_COLORS.primary,
  },
  {
    name: "secondaryColor",
    label: "Texto secundário",
    hint: "Descrições e legendas",
    fallback: DEFAULT_COLORS.secondary,
  },
  {
    name: "accentColor",
    label: "Destaque",
    hint: "Rótulos, traços e ícones",
    fallback: DEFAULT_COLORS.accent,
  },
  {
    name: "surfaceColor",
    label: "Blocos e bordas",
    hint: "Faixas alternadas entre ambientes",
    fallback: DEFAULT_COLORS.surface,
  },
] as const;

export function BrandingForm({ organization }: { organization: Organization }) {
  const [state, formAction, pending] = useActionState(
    updateBrandingAction,
    initialState,
  );
  const [logoState, logoAction, logoPending] = useActionState(
    uploadLogoAction,
    initialState,
  );
  const [, startTransition] = useTransition();

  // Estado local só para a pré-visualização acompanhar a digitação.
  const [colors, setColors] = useState<Record<string, string>>({
    backgroundColor: organization.backgroundColor ?? DEFAULT_COLORS.background,
    primaryColor: organization.primaryColor ?? DEFAULT_COLORS.primary,
    secondaryColor: organization.secondaryColor ?? DEFAULT_COLORS.secondary,
    accentColor: organization.accentColor ?? DEFAULT_COLORS.accent,
    surfaceColor: organization.surfaceColor ?? DEFAULT_COLORS.surface,
  });
  const [fontPair, setFontPair] = useState<FontPairKey>(
    (FONT_PAIR_KEYS as string[]).includes(organization.fontPair)
      ? (organization.fontPair as FontPairKey)
      : "classico",
  );
  const [name, setName] = useState(organization.name);
  const [tagline, setTagline] = useState(organization.tagline ?? "");

  const pair = FONT_PAIRS[fontPair];

  return (
    <div className="space-y-6">
      {/* Carrega todos os pares de uma vez só para a pré-visualização */}
      <link rel="stylesheet" href={allFontPairsHref()} />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form action={formAction} className="space-y-6">
          <input
            type="hidden"
            name="organizationId"
            value={organization.id}
          />

          <section className="space-y-3 rounded border bg-white p-4">
            <div>
              <h2 className="text-sm font-medium text-neutral-700">
                Nome e assinatura
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Aparecem no topo e no rodapé de todos os seus microsites.
              </p>
            </div>

            <label className="block text-sm">
              Nome do escritório
              <input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-sm">
              Assinatura (opcional)
              <input
                name="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Arquitetura &amp; Interiores"
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </label>
          </section>

          <section className="space-y-3 rounded border bg-white p-4">
            <div>
              <h2 className="text-sm font-medium text-neutral-700">
                Tipografia
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Combinações testadas nos tamanhos extremos do site — do título
                da capa às legendas pequenas.
              </p>
            </div>

            <div className="space-y-2">
              {FONT_PAIR_KEYS.map((key) => {
                const option = FONT_PAIRS[key];
                const selected = fontPair === key;
                return (
                  <label
                    key={key}
                    className={
                      "flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors " +
                      (selected
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-400")
                    }
                  >
                    <input
                      type="radio"
                      name="fontPair"
                      value={key}
                      checked={selected}
                      onChange={() => setFontPair(key)}
                    />
                    <span className="flex-1">
                      <span
                        className="block text-[22px] leading-tight"
                        style={{ fontFamily: `"${option.heading}", serif` }}
                      >
                        {name || "Seu escritório"}
                      </span>
                      <span
                        className="block text-xs text-neutral-500"
                        style={{ fontFamily: `"${option.body}", sans-serif` }}
                      >
                        {option.label} · {option.heading} + {option.body}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="space-y-3 rounded border bg-white p-4">
            <div>
              <h2 className="text-sm font-medium text-neutral-700">Cores</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Use as cores do seu manual de marca. A pré-visualização ao lado
                acompanha as alterações.
              </p>
            </div>

            {COLOR_FIELDS.map((field) => (
              <div key={field.name} className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors[field.name]}
                  onChange={(e) =>
                    setColors((c) => ({ ...c, [field.name]: e.target.value }))
                  }
                  className="h-9 w-12 shrink-0 cursor-pointer rounded border"
                  aria-label={field.label}
                />
                <div className="flex-1">
                  <p className="text-sm">{field.label}</p>
                  <p className="text-xs text-neutral-500">{field.hint}</p>
                </div>
                <input
                  name={field.name}
                  value={colors[field.name]}
                  onChange={(e) =>
                    setColors((c) => ({ ...c, [field.name]: e.target.value }))
                  }
                  className="w-28 rounded border px-2 py-1 font-mono text-xs uppercase"
                />
              </div>
            ))}
          </section>

          <section className="space-y-2 rounded border bg-white p-4">
            <h2 className="text-sm font-medium text-neutral-700">Rodapé</h2>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="showPoweredBy"
                defaultChecked={organization.showPoweredBy}
                className="mt-1"
              />
              <span>
                Exibir o selo do parceiro de distribuição
                <span className="mt-1 block text-xs text-neutral-500">
                  Só aparece quando a plataforma estiver configurada com um
                  parceiro. Sem isso, o rodapé mostra apenas a sua marca.
                </span>
              </span>
            </label>
          </section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {pending ? "Salvando..." : "Salvar identidade"}
            </button>
            {state.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}
            {state.ok && !state.error && (
              <p className="text-sm text-green-700">Salvo.</p>
            )}
          </div>
        </form>

        {/* --- Pré-visualização --- */}
        <div className="space-y-4">
          <section className="space-y-3 rounded border bg-white p-4">
            <h2 className="text-sm font-medium text-neutral-700">Logo</h2>
            {organization.logoUrl ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center rounded border bg-neutral-50 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={organization.logoUrl}
                    alt={organization.name}
                    className="max-h-[60px] w-auto object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => removeLogoAction(organization.id))
                  }
                  className="text-xs text-red-600 underline"
                >
                  remover logo
                </button>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">
                Sem logo. O nome do escritório é usado no lugar.
              </p>
            )}

            <form action={logoAction} className="flex flex-wrap items-end gap-2">
              <input
                type="hidden"
                name="organizationId"
                value={organization.id}
              />
              <input
                type="file"
                name="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                required
                className="text-xs"
              />
              <button
                type="submit"
                disabled={logoPending}
                className="rounded bg-neutral-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
              >
                {logoPending ? "Enviando..." : "Enviar"}
              </button>
              {logoState.error && (
                <p className="w-full text-xs text-red-600">{logoState.error}</p>
              )}
            </form>
            <p className="text-xs text-neutral-500">
              Prefira PNG ou SVG com fundo transparente.
            </p>
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="mb-3 text-sm font-medium text-neutral-700">
              Pré-visualização
            </h2>
            <div
              className="overflow-hidden rounded border"
              style={{ backgroundColor: colors.backgroundColor }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${colors.surfaceColor}55` }}
              >
                {organization.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={organization.logoUrl}
                    alt=""
                    className="max-h-[22px] w-auto object-contain"
                  />
                ) : (
                  <span
                    className="text-[13px] uppercase tracking-[0.14em]"
                    style={{
                      fontFamily: `"${pair.heading}", serif`,
                      color: colors.primaryColor,
                    }}
                  >
                    {name || "Seu escritório"}
                  </span>
                )}
                <span
                  className="text-[8px] uppercase tracking-[0.18em]"
                  style={{ color: colors.secondaryColor }}
                >
                  Projeto
                </span>
              </div>

              <div className="px-4 py-7">
                <p
                  className="text-[8px] uppercase tracking-[0.25em]"
                  style={{ color: colors.accentColor }}
                >
                  Florianópolis · SC
                </p>
                <p
                  className="mt-2 text-[30px] leading-[0.9] tracking-[-0.03em]"
                  style={{
                    fontFamily: `"${pair.heading}", serif`,
                    color: colors.primaryColor,
                  }}
                >
                  Apartamento
                  <br />
                  Exemplo
                </p>
                <div
                  className="mt-3 h-px w-[60px]"
                  style={{ backgroundColor: colors.accentColor }}
                />
                <p
                  className="mt-3 text-[9px] uppercase tracking-[0.08em]"
                  style={{
                    fontFamily: `"${pair.body}", sans-serif`,
                    color: colors.secondaryColor,
                  }}
                >
                  Projeto de arquitetura de interiores
                </p>
              </div>

              <div
                className="px-4 py-5"
                style={{ backgroundColor: `${colors.surfaceColor}33` }}
              >
                <p
                  className="text-[8px] uppercase tracking-[0.25em]"
                  style={{ color: colors.accentColor }}
                >
                  Ambientes
                </p>
                <p
                  className="mt-1 text-[19px] tracking-[-0.02em]"
                  style={{
                    fontFamily: `"${pair.heading}", serif`,
                    color: colors.primaryColor,
                  }}
                >
                  Living
                </p>
                <p
                  className="mt-1 text-[10px] leading-relaxed"
                  style={{
                    fontFamily: `"${pair.body}", sans-serif`,
                    color: colors.secondaryColor,
                  }}
                >
                  Integração entre estar e jantar, com marcenaria em madeira
                  natural.
                </p>
              </div>

              <div className="px-4 py-5 text-center">
                <p
                  className="text-[13px] uppercase tracking-[0.2em]"
                  style={{
                    fontFamily: `"${pair.heading}", serif`,
                    color: colors.primaryColor,
                  }}
                >
                  {name || "Seu escritório"}
                </p>
                {tagline && (
                  <p
                    className="mt-1 text-[8px] uppercase tracking-[0.2em]"
                    style={{
                      fontFamily: `"${pair.body}", sans-serif`,
                      color: colors.secondaryColor,
                    }}
                  >
                    {tagline}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
