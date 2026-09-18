"use client";

import { useActionState, useTransition } from "react";
import type { Environment, Media, MediaType } from "@/domain/types";
import {
  deleteMediaAction,
  setHeroImageAction,
  uploadMediaAction,
  type FormActionState,
} from "./media-actions";

const initialState: FormActionState = { error: null };

/** Moodboard — aparece ao lado do texto de conceito, no topo do site. */
export function MoodboardPanel({
  projectId,
  media,
  heroImage,
}: {
  projectId: string;
  media: Media[];
  heroImage: string | null;
}) {
  const items = media.filter((m) => m.type === "moodboard");

  return (
    <PanelShell
      title="Moodboard"
      hint="Aparece ao lado do texto de apresentação, logo no início do site."
    >
      <UploadForm
        projectId={projectId}
        typeOptions={[{ value: "moodboard", label: "Moodboard" }]}
      />
      <MediaGrid items={items} projectId={projectId} heroImage={heroImage} />
    </PanelShell>
  );
}

/** Imagens de cada ambiente — formam o percurso visual do site. */
export function EnvironmentMediaPanel({
  projectId,
  media,
  environments,
  heroImage,
}: {
  projectId: string;
  media: Media[];
  environments: Environment[];
  heroImage: string | null;
}) {
  return (
    <PanelShell
      title="Imagens dos ambientes"
      hint="Cada ambiente vira uma seção do site, na ordem em que aparecem aqui."
    >
      {environments.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Crie um ambiente acima para poder enviar imagens.
        </p>
      ) : (
        <div className="space-y-5">
          {environments.map((env) => {
            const envMedia = media.filter((m) => m.environmentId === env.id);
            return (
              <div key={env.id} className="space-y-2 border-b pb-4 last:border-0">
                <p className="text-sm font-medium">
                  {env.name}
                  {env.zone && (
                    <span className="ml-2 text-xs font-normal text-neutral-400">
                      {env.zone}
                    </span>
                  )}
                </p>
                <UploadForm
                  projectId={projectId}
                  environmentId={env.id}
                  typeOptions={[{ value: "render", label: "Imagem" }]}
                />
                <MediaGrid
                  items={envMedia}
                  projectId={projectId}
                  heroImage={heroImage}
                />
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}

/** Planta baixa e pranchas executivas — cards que abrem o arquivo. */
export function TechnicalPanel({
  projectId,
  media,
  heroImage,
}: {
  projectId: string;
  media: Media[];
  heroImage: string | null;
}) {
  const items = media.filter(
    (m) => m.type === "floor_plan" || m.type === "document",
  );

  return (
    <PanelShell
      title="Desenhos técnicos"
      hint="Envie PDF para o cliente poder abrir o arquivo. O código (ex.: ARQ-03) e o título aparecem no card do site."
    >
      <UploadForm
        projectId={projectId}
        withDrawingFields
        acceptPdf
        typeOptions={[
          { value: "floor_plan", label: "Planta Baixa" },
          { value: "document", label: "Prancha executiva" },
        ]}
      />
      <MediaGrid items={items} projectId={projectId} heroImage={heroImage} />
    </PanelShell>
  );
}

function PanelShell({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded border bg-white p-4">
      <div>
        <h2 className="text-sm font-medium text-neutral-700">{title}</h2>
        {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function UploadForm({
  projectId,
  environmentId,
  typeOptions,
  withDrawingFields = false,
  acceptPdf = false,
}: {
  projectId: string;
  environmentId?: string;
  typeOptions: { value: MediaType; label: string }[];
  withDrawingFields?: boolean;
  acceptPdf?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    uploadMediaAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      {environmentId && (
        <input type="hidden" name="environmentId" value={environmentId} />
      )}

      {typeOptions.length > 1 ? (
        <div>
          <label className="block text-xs text-neutral-500">Tipo</label>
          <select name="type" className="rounded border px-2 py-2 text-sm">
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="type" value={typeOptions[0].value} />
      )}

      {withDrawingFields && (
        <>
          <div className="w-28">
            <label className="block text-xs text-neutral-500">Código</label>
            <input
              name="code"
              placeholder="ARQ-03"
              className="w-full rounded border px-2 py-2 text-sm"
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="block text-xs text-neutral-500">Título</label>
            <input
              name="title"
              placeholder="Estudo de Layout"
              className="w-full rounded border px-2 py-2 text-sm"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-xs text-neutral-500">Arquivo</label>
        <input
          type="file"
          name="file"
          accept={acceptPdf ? "image/*,application/pdf" : "image/*"}
          required
          className="text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Enviar"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}

function MediaGrid({
  items,
  projectId,
  heroImage,
}: {
  items: Media[];
  projectId: string;
  heroImage: string | null;
}) {
  const [, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhum arquivo ainda.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => {
        const isPdf = Boolean(item.fileUrl);
        return (
          <div key={item.id} className="space-y-1">
            {isPdf ? (
              <a
                href={item.fileUrl ?? item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-square w-full items-center justify-center rounded bg-neutral-100 text-xs text-neutral-500"
              >
                PDF ↗
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.title ?? item.type}
                className="aspect-square w-full rounded object-cover"
              />
            )}
            <p className="truncate text-xs text-neutral-500">
              {[item.code, item.title].filter(Boolean).join(" · ") || item.type}
            </p>
            <div className="flex gap-2">
              {!isPdf && (
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() =>
                      setHeroImageAction(projectId, item.url),
                    )
                  }
                  disabled={heroImage === item.url}
                  className="text-xs text-neutral-600 underline disabled:text-neutral-400 disabled:no-underline"
                >
                  {heroImage === item.url ? "É a capa" : "Usar como capa"}
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  startTransition(() => deleteMediaAction(item.id, projectId))
                }
                className="text-xs text-red-600 underline"
              >
                remover
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
