"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import type { Environment, Media, MediaType } from "@/domain/types";
import {
  deleteMediaAction,
  registerMediaAction,
  setHeroImageAction,
} from "./media-actions";

const MEDIA_BUCKET = "project-media";

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

function slugifyFilename(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${crypto.randomUUID()}-${base || "arquivo"}`;
}

/** Limite por arquivo do plano gratuito do Supabase. */
const LIMITE_BYTES = 50 * 1024 * 1024;

/**
 * Reduz a imagem no navegador antes de enviar: lado maior limitado e JPEG de
 * alta qualidade. Um render de 12 MB costuma virar menos de 1 MB sem
 * diferença visível na tela — economiza armazenamento e deixa o site leve no
 * celular. PDFs, SVG e GIF passam intactos. Se algo falhar (imagem gigante
 * demais para a memória do aparelho, formato raro), envia o original.
 */
async function reduzirImagem(file: File, maxLado: number): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    if (escala === 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const w = Math.round(bitmap.width * escala);
    const h = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    // Fundo branco: PNG com transparência (plantas) não fica preto no JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.86),
    );
    if (!blob || blob.size >= file.size) return file;
    const nome = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nome, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/**
 * Envio de arquivos direto do navegador para o Storage, sem passar pelo
 * servidor (que limita a 1 MB por requisição). Aceita vários arquivos de uma
 * vez e envia um por um, mostrando o progresso.
 */
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
  const router = useRouter();
  const [type, setType] = useState<MediaType>(typeOptions[0].value);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [inputKey, setInputKey] = useState(0);

  // Código e título descrevem UMA prancha: com vários arquivos, ficam em branco.
  const multiple = !withDrawingFields;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;

    const supabase = createBrowserSupabase();
    const failed: string[] = [];

    // Plantas e pranchas precisam de mais resolução para ler cotas e textos.
    const maxLado = type === "floor_plan" || type === "document" ? 4000 : 2560;

    for (let i = 0; i < files.length; i++) {
      const original = files[i];
      const contador = files.length > 1 ? ` ${i + 1} de ${files.length}` : "";

      setProgress(`Otimizando${contador}...`);
      const file = await reduzirImagem(original, maxLado);

      if (file.size > LIMITE_BYTES) {
        const mb = (file.size / 1024 / 1024).toFixed(0);
        failed.push(
          `${original.name}: tem ${mb} MB e o limite é 50 MB. Reduza o arquivo (no Acrobat: "Reduzir tamanho do arquivo") e envie de novo.`,
        );
        continue;
      }

      setProgress(`Enviando${contador}...`);
      const path = `${projectId}/${slugifyFilename(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (upErr) {
        failed.push(`${original.name}: ${upErr.message}`);
        continue;
      }

      const result = await registerMediaAction({
        projectId,
        environmentId,
        type,
        path,
        isPdf: original.type === "application/pdf",
        code: code || undefined,
        title: title || undefined,
      });
      if (result.error) failed.push(`${original.name}: ${result.error}`);
    }

    setErrors(failed);
    setProgress(null);
    setFiles([]);
    setCode("");
    setTitle("");
    setInputKey((k) => k + 1);
    router.refresh();
  }

  const pending = progress !== null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      {typeOptions.length > 1 && (
        <div>
          <label className="block text-xs text-neutral-500">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as MediaType)}
            className="rounded border px-2 py-2 text-sm"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {withDrawingFields && (
        <>
          <div className="w-28">
            <label className="block text-xs text-neutral-500">Código</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ARQ-03"
              className="w-full rounded border px-2 py-2 text-sm"
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="block text-xs text-neutral-500">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Estudo de Layout"
              className="w-full rounded border px-2 py-2 text-sm"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-xs text-neutral-500">
          {multiple ? "Arquivos (pode selecionar vários)" : "Arquivo"}
        </label>
        <input
          key={inputKey}
          type="file"
          multiple={multiple}
          accept={acceptPdf ? "image/*,application/pdf" : "image/*"}
          required
          disabled={pending}
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending || files.length === 0}
        className="rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {progress ??
          (files.length > 1 ? `Enviar ${files.length} arquivos` : "Enviar")}
      </button>

      {errors.length > 0 && (
        <div className="w-full text-sm text-red-600">
          {errors.map((err) => (
            <p key={err}>{err}</p>
          ))}
        </div>
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
