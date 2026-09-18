"use client";

import { useTransition } from "react";
import type { Project } from "@/domain/types";
import { setProjectPublicationAction } from "../actions";

export function PublicationPanel({ project }: { project: Project }) {
  const [isPending, startTransition] = useTransition();

  function toggle(field: "published" | "publicVisibility" | "seoIndexable") {
    startTransition(() => {
      setProjectPublicationAction(project.id, {
        [field]: !project[field],
      });
    });
  }

  return (
    <div className="space-y-3 rounded border bg-white p-4">
      <h2 className="text-sm font-medium text-neutral-700">Publicação</h2>

      <ToggleRow
        label="Publicado (visível no admin como ativo)"
        checked={project.published}
        disabled={isPending}
        onChange={() => toggle("published")}
      />
      <ToggleRow
        label="Acessível publicamente por link"
        checked={project.publicVisibility}
        disabled={isPending}
        onChange={() => toggle("publicVisibility")}
      />
      <ToggleRow
        label="Indexável pelo Google (seo_indexable)"
        checked={project.seoIndexable}
        disabled={isPending || !project.publicVisibility}
        onChange={() => toggle("seoIndexable")}
      />
      {!project.publicVisibility && (
        <p className="text-xs text-neutral-500">
          Indexação só pode ser ativada quando o projeto já é acessível por
          link.
        </p>
      )}

      {project.publicVisibility && project.published && (
        <p className="text-xs text-neutral-500">
          URL pública: <code>/p/[org]/{project.slug}</code>
        </p>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
    </label>
  );
}
