"use client";

import { useState, useTransition } from "react";
import type { Project } from "@/domain/types";
import {
  regeneratePublicTokenAction,
  setPublicAccessEnabledAction,
  setPublicAccessExpiryAction,
} from "../actions";

/** Converte timestamptz em valor aceito por <input type="date">. */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PublicLinkPanel({
  project,
  orgSlug,
}: {
  project: Project;
  orgSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [confirmingRegen, setConfirmingRegen] = useState(false);

  const publicPath = `/p/${orgSlug}/${project.slug}/${project.publicToken}`;
  const isPublished = project.published && project.publicVisibility;
  const expired =
    project.publicAccessExpiresAt !== null &&
    new Date(project.publicAccessExpiresAt) <= new Date();
  const isLive = isPublished && project.publicAccessEnabled && !expired;

  function handleCopy() {
    navigator.clipboard
      .writeText(`${window.location.origin}${publicPath}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
  }

  if (!isPublished) {
    return (
      <div className="rounded border border-dashed bg-neutral-50 p-4 text-sm text-neutral-500">
        O link aparecerá aqui quando o projeto for publicado e marcado como
        acessível por link (aba Publicação).
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-neutral-500">Link da apresentação</p>
          <code className="block truncate text-sm">{publicPath}</code>
          <p className="mt-1 text-xs text-neutral-500">
            O trecho final é aleatório: sem ele o projeto não abre, mesmo que
            alguém acerte o nome.
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-700 underline"
          >
            Abrir
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="text-sm text-neutral-700 underline"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        </div>
      </div>

      {!isLive && (
        <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {expired
            ? "O prazo venceu. Quem abrir vê um aviso do escritório."
            : "O acesso está desligado. Quem abrir vê um aviso do escritório."}
        </p>
      )}

      <div className="grid gap-4 border-t pt-4 md:grid-cols-3">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={project.publicAccessEnabled}
            disabled={isPending}
            onChange={(e) =>
              startTransition(() =>
                setPublicAccessEnabledAction(project.id, e.target.checked),
              )
            }
            className="mt-1"
          />
          <span>
            Link ativo
            <span className="mt-0.5 block text-xs text-neutral-500">
              Desligue para pausar sem despublicar.
            </span>
          </span>
        </label>

        <label className="text-sm">
          Validade
          <input
            type="date"
            defaultValue={toDateInput(project.publicAccessExpiresAt)}
            disabled={isPending}
            onChange={(e) =>
              startTransition(() =>
                setPublicAccessExpiryAction(
                  project.id,
                  e.target.value
                    ? new Date(`${e.target.value}T23:59:59`).toISOString()
                    : null,
                ),
              )
            }
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
          />
          <span className="mt-0.5 block text-xs text-neutral-500">
            Em branco, não expira.
          </span>
        </label>

        <div className="text-sm">
          Gerar link novo
          {confirmingRegen ? (
            <div className="mt-1 space-y-1">
              <p className="text-xs text-red-600">
                O link atual para de funcionar na hora.
              </p>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => {
                      regeneratePublicTokenAction(project.id);
                      setConfirmingRegen(false);
                    })
                  }
                  className="font-medium text-red-600 underline"
                >
                  {isPending ? "Gerando..." : "Confirmar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingRegen(false)}
                  className="text-neutral-500 underline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setConfirmingRegen(true)}
                className="mt-1 block text-xs text-neutral-700 underline"
              >
                Gerar novo endereço
              </button>
              <span className="mt-0.5 block text-xs text-neutral-500">
                Use se o link foi encaminhado para quem não devia.
              </span>
            </>
          )}
        </div>
      </div>

      <div className="border-t pt-3 text-xs text-neutral-500">
        {project.publicOpenedCount > 0 ? (
          <>
            Aberto {project.publicOpenedCount}{" "}
            {project.publicOpenedCount === 1 ? "vez" : "vezes"}
            {project.publicLastOpenedAt && (
              <> · última vez em {formatDateTime(project.publicLastOpenedAt)}</>
            )}
          </>
        ) : (
          "Ainda não foi aberto."
        )}
      </div>
    </div>
  );
}
