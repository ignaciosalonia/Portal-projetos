"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Media } from "@/domain/types";
import {
  APRESENTACAO_IMAGEM_KEY,
  SECTION_TEXT_FIELDS,
  sectionText,
  type SectionGroup,
} from "@/domain/section-texts";
import { updateSectionTextsAction } from "../actions";

const TITLES: Record<SectionGroup, { title: string; hint: string }> = {
  capa: {
    title: "Textos da capa",
    hint: "O nome e o subtítulo da capa ficam nos campos acima.",
  },
  apresentacao: {
    title: "Bloco de apresentação",
    hint: "O primeiro bloco depois da capa. Use para o conceito, o moodboard ou o que fizer sentido neste projeto.",
  },
  ambientes: {
    title: "Textos da seção de ambientes",
    hint: "A faixa que abre o percurso pelos ambientes.",
  },
  tecnico: {
    title: "Textos da seção de desenhos técnicos",
    hint: "Cabeçalho acima dos cards de plantas e pranchas.",
  },
  percurso: {
    title: "Textos da seção de percurso",
    hint: "Cabeçalho acima da linha do tempo.",
  },
};

/**
 * Edição dos textos de uma seção do microsite. Os campos já vêm com o texto
 * que está no site (salvo ou padrão): o que ela vê aqui é o que o cliente vê.
 * Campo em branco esconde aquele elemento.
 */
export function SectionTextsPanel({
  projectId,
  group,
  texts,
  description,
  images,
}: {
  projectId: string;
  group: SectionGroup;
  texts: Record<string, string>;
  /** Só no bloco de apresentação: texto do conceito. */
  description?: string | null;
  /** Só no bloco de apresentação: imagens disponíveis para escolher. */
  images?: Media[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fields = SECTION_TEXT_FIELDS[group];
  const isApresentacao = group === "apresentacao";

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, sectionText(texts, f.key)])),
  );
  const [desc, setDesc] = useState(description ?? "");
  const [imageId, setImageId] = useState(texts[APRESENTACAO_IMAGEM_KEY] ?? "");
  const [status, setStatus] = useState<string | null>(null);

  function save() {
    setStatus(null);
    startTransition(async () => {
      const payload = isApresentacao
        ? { ...values, [APRESENTACAO_IMAGEM_KEY]: imageId }
        : values;
      const result = await updateSectionTextsAction({
        projectId,
        texts: payload,
        description: isApresentacao ? desc : undefined,
      });
      setStatus(result.error ?? "Salvo.");
      if (!result.error) router.refresh();
    });
  }

  const pickable = (images ?? []).filter((m) => !m.fileUrl);

  return (
    <div className="space-y-4 rounded border bg-white p-4">
      <div>
        <h2 className="text-sm font-medium text-neutral-700">
          {TITLES[group].title}
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          {TITLES[group].hint} Campo em branco não aparece no site.
        </p>
      </div>

      {fields.map((f) => (
        <label key={f.key} className="block text-sm">
          <span className="flex items-baseline justify-between gap-2">
            {f.label}
            {values[f.key] !== f.default && (
              <button
                type="button"
                onClick={() => setValues((v) => ({ ...v, [f.key]: f.default }))}
                className="text-xs text-neutral-500 underline"
              >
                voltar ao padrão
              </button>
            )}
          </span>
          {f.multiline ? (
            <textarea
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              rows={f.key.endsWith("_texto") ? 3 : 2}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          ) : (
            <input
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          )}
          {f.hint && <span className="mt-1 block text-xs text-neutral-500">{f.hint}</span>}
        </label>
      ))}

      {isApresentacao && (
        <>
          <label className="block text-sm">
            Texto
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </label>

          <div className="text-sm">
            <p>Imagem</p>
            <p className="mb-2 text-xs text-neutral-500">
              Automático usa o primeiro moodboard, ou a capa se não houver.
            </p>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              <button
                type="button"
                onClick={() => setImageId("")}
                className={
                  "flex aspect-square items-center justify-center rounded border text-xs " +
                  (imageId === "" ? "border-neutral-900 ring-2 ring-neutral-900" : "text-neutral-500")
                }
              >
                Automático
              </button>
              {pickable.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setImageId(m.id)}
                  className={
                    "overflow-hidden rounded border " +
                    (imageId === m.id ? "border-neutral-900 ring-2 ring-neutral-900" : "")
                  }
                  title={m.title ?? m.type}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt={m.title ?? m.type}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar textos"}
        </button>
        {status && (
          <p className={status === "Salvo." ? "text-sm text-green-700" : "text-sm text-red-600"}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
