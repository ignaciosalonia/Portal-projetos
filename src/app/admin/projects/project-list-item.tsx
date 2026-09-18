"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Project } from "@/domain/types";
import { deleteProjectAction } from "./actions";

export function ProjectListItem({
  project,
  publicPath,
}: {
  project: Project;
  publicPath: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLive = project.published && project.publicVisibility;

  function handleCopy() {
    const url = `${window.location.origin}${publicPath}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleDelete() {
    startTransition(() => deleteProjectAction(project.id));
  }

  return (
    <li className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/admin/projects/${project.id}`}
            className="font-medium hover:underline"
          >
            {project.name}
          </Link>
          <p className="text-xs text-neutral-500">
            {project.slug} · {project.status}
            {project.published ? " · publicado" : " · rascunho"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isLive && (
            <>
              <a
                href={publicPath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-600 underline"
              >
                Ver site
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-neutral-600 underline"
              >
                {copied ? "Copiado!" : "Copiar link"}
              </button>
            </>
          )}

          {confirming ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-red-600">Excluir de vez?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="font-medium text-red-600 underline"
              >
                {isPending ? "Excluindo..." : "Sim"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-neutral-500 underline"
              >
                Cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-xs text-red-600 underline"
            >
              excluir
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
