"use client";

import { useActionState } from "react";
import type { Project } from "@/domain/types";
import { updateProjectGeneralAction, type FormActionState } from "../actions";

const initialState: FormActionState = { error: null };

export function ProjectGeneralForm({ project }: { project: Project }) {
  const [state, formAction, pending] = useActionState(
    updateProjectGeneralAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4 rounded border bg-white p-4">
      <input type="hidden" name="projectId" value={project.id} />

      <label className="col-span-2 text-sm">
        Nome
        <input
          name="name"
          defaultValue={project.name}
          required
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </label>

      <label className="col-span-2 text-sm">
        Subtítulo
        <input
          name="subtitle"
          defaultValue={project.subtitle ?? ""}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </label>

      <label className="col-span-2 text-sm">
        Descrição
        <textarea
          name="description"
          defaultValue={project.description ?? ""}
          rows={4}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        Cidade
        <input
          name="city"
          defaultValue={project.city ?? ""}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        UF
        <input
          name="state"
          defaultValue={project.state ?? ""}
          maxLength={2}
          className="mt-1 w-full rounded border px-3 py-2 text-sm uppercase"
        />
      </label>

      <label className="text-sm">
        País
        <input
          name="country"
          defaultValue={project.country ?? "BR"}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        Tipo de projeto
        <input
          name="projectType"
          defaultValue={project.projectType ?? ""}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </label>

      <div className="col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
