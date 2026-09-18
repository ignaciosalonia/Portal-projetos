"use client";

import { useActionState, useTransition } from "react";
import type { Environment } from "@/domain/types";
import {
  createEnvironmentAction,
  deleteEnvironmentAction,
  type FormActionState,
} from "../actions";
import { updateEnvironmentZoneAction } from "./media-actions";

const initialState: FormActionState = { error: null };

export function EnvironmentsPanel({
  projectId,
  environments,
}: {
  projectId: string;
  environments: Environment[];
}) {
  const [state, formAction, pending] = useActionState(
    createEnvironmentAction,
    initialState,
  );
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-3 rounded border bg-white p-4">
      <h2 className="text-sm font-medium text-neutral-700">Ambientes</h2>

      <ul className="space-y-2">
        {environments.map((env) => (
          <li
            key={env.id}
            className="flex items-center justify-between border-b pb-2 text-sm"
          >
            <span>{env.name}</span>
            <div className="flex items-center gap-2">
              <input
                defaultValue={env.zone ?? ""}
                placeholder="Zona (ex.: Área Social)"
                onBlur={(e) =>
                  startTransition(() =>
                    updateEnvironmentZoneAction(
                      env.id,
                      projectId,
                      e.target.value,
                    ),
                  )
                }
                className="w-40 rounded border px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  startTransition(() =>
                    deleteEnvironmentAction(env.id, projectId),
                  )
                }
                className="text-xs text-red-600 underline"
              >
                remover
              </button>
            </div>
          </li>
        ))}
        {environments.length === 0 && (
          <li className="text-sm text-neutral-500">Nenhum ambiente ainda.</li>
        )}
      </ul>

      <form action={formAction} className="flex items-end gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="flex-1">
          <label className="block text-xs text-neutral-500">
            Novo ambiente
          </label>
          <input
            name="name"
            required
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-neutral-500">
            Zona (opcional)
          </label>
          <input
            name="zone"
            placeholder="Área Social"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
