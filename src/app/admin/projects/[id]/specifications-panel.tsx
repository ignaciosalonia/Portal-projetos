"use client";

import { useActionState, useTransition } from "react";
import type { Environment, SpecificationItem } from "@/domain/types";
import {
  createSpecificationItemAction,
  deleteSpecificationItemAction,
  type FormActionState,
} from "./media-actions";

const initialState: FormActionState = { error: null };

export function SpecificationsPanel({
  projectId,
  items,
  environments,
  title = "Materiais e produtos",
  hint,
}: {
  projectId: string;
  items: SpecificationItem[];
  environments: Environment[];
  title?: string;
  hint?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createSpecificationItemAction,
    initialState,
  );
  const [, startTransition] = useTransition();

  // Sem lista de ambientes, o painel é o de itens gerais (sem ambiente).
  const perEnvironment = environments.length > 0;

  return (
    <div className="space-y-4 rounded border bg-white p-4">
      <div>
        <h2 className="text-sm font-medium text-neutral-700">{title}</h2>
        {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const env = environments.find((e) => e.id === item.environmentId);
          return (
            <li
              key={item.id}
              className="flex items-center justify-between border-b pb-2 text-sm"
            >
              <div>
                <span className="font-medium">{item.name}</span>{" "}
                <span className="text-neutral-500">
                  {[item.brand, item.category].filter(Boolean).join(" · ")}
                </span>
                {env && (
                  <span className="ml-2 text-xs text-neutral-400">
                    {env.name}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  startTransition(() =>
                    deleteSpecificationItemAction(item.id, projectId),
                  )
                }
                className="text-xs text-red-600 underline"
              >
                remover
              </button>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="text-sm text-neutral-500">Nenhum item ainda.</li>
        )}
      </ul>

      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="kind" value="material" />

        {perEnvironment && (
          <div>
            <label className="block text-xs text-neutral-500">Ambiente</label>
            <select
              name="environmentId"
              required
              className="rounded border px-2 py-2 text-sm"
            >
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="min-w-[140px] flex-1">
          <label className="block text-xs text-neutral-500">Nome</label>
          <input
            name="name"
            required
            placeholder="Golden Spyder"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-[110px]">
          <label className="block text-xs text-neutral-500">Marca</label>
          <input
            name="brand"
            placeholder="Tons de Pedra"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-[130px]">
          <label className="block text-xs text-neutral-500">Aplicação</label>
          <input
            name="category"
            placeholder="lavatório"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-[150px]">
          <label className="block text-xs text-neutral-500">
            Link (opcional)
          </label>
          <input
            name="externalUrl"
            type="url"
            placeholder="https://"
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
