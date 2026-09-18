"use client";

import { useActionState } from "react";
import { createProjectAction, type FormActionState } from "./actions";

const initialState: FormActionState = { error: null };

export function NewProjectForm({ organizationId }: { organizationId: string }) {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded border bg-white p-4"
    >
      <input type="hidden" name="organizationId" value={organizationId} />

      <div className="flex-1 min-w-[180px]">
        <label htmlFor="name" className="block text-xs text-neutral-500">
          Nome do projeto
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div className="w-32">
        <label htmlFor="city" className="block text-xs text-neutral-500">
          Cidade
        </label>
        <input
          id="city"
          name="city"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div className="w-20">
        <label htmlFor="state" className="block text-xs text-neutral-500">
          UF
        </label>
        <input
          id="state"
          name="state"
          maxLength={2}
          className="w-full rounded border px-3 py-2 text-sm uppercase"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Criando..." : "Novo projeto"}
      </button>

      {state.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
