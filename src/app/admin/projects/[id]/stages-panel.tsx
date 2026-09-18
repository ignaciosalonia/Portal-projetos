"use client";

import { useActionState, useTransition } from "react";
import type { ProjectStage, StageStatus } from "@/domain/types";
import {
  createStageAction,
  deleteStageAction,
  updateStageStatusAction,
  type FormActionState,
} from "../actions";

const initialState: FormActionState = { error: null };

const STATUS_LABEL: Record<StageStatus, string> = {
  completed: "Concluída",
  current: "Fase atual",
  pending: "A seguir",
};

export function StagesPanel({
  projectId,
  stages,
}: {
  projectId: string;
  stages: ProjectStage[];
}) {
  const [state, formAction, pending] = useActionState(
    createStageAction,
    initialState,
  );
  const [, startTransition] = useTransition();

  const nextOrder =
    stages.length > 0 ? Math.max(...stages.map((s) => s.orderIndex)) + 1 : 1;

  return (
    <div className="space-y-4 rounded border bg-white p-4">
      <div>
        <h2 className="text-sm font-medium text-neutral-700">
          Percurso do projeto
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Vira a linha do tempo no site. A etapa marcada como &quot;Fase
          atual&quot; aparece destacada para o cliente.
        </p>
      </div>

      <ul className="space-y-2">
        {stages.map((stage) => (
          <li key={stage.id} className="border-b pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm">
                  <span className="mr-2 text-neutral-400">
                    {String(stage.orderIndex).padStart(2, "0")}
                  </span>
                  <span className="font-medium">{stage.name}</span>
                </p>
                {stage.description && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {stage.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  defaultValue={stage.status}
                  onChange={(e) =>
                    startTransition(() =>
                      updateStageStatusAction(
                        stage.id,
                        projectId,
                        e.target.value as StageStatus,
                      ),
                    )
                  }
                  className="rounded border px-2 py-1 text-xs"
                >
                  {(
                    Object.keys(STATUS_LABEL) as StageStatus[]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => deleteStageAction(stage.id, projectId))
                  }
                  className="text-xs text-red-600 underline"
                >
                  remover
                </button>
              </div>
            </div>
          </li>
        ))}
        {stages.length === 0 && (
          <li className="text-sm text-neutral-500">Nenhuma etapa ainda.</li>
        )}
      </ul>

      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="orderIndex" value={nextOrder} />

        <div className="min-w-[160px] flex-1">
          <label className="block text-xs text-neutral-500">Etapa</label>
          <input
            name="name"
            required
            placeholder="Modelação 3D e apresentação"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-[200px] flex-[2]">
          <label className="block text-xs text-neutral-500">
            Descrição (opcional)
          </label>
          <input
            name="description"
            placeholder="Visualização dos ambientes e validação conjunta."
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-500">Situação</label>
          <select
            name="status"
            defaultValue="pending"
            className="rounded border px-2 py-2 text-sm"
          >
            {(Object.keys(STATUS_LABEL) as StageStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
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
