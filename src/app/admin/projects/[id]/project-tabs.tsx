"use client";

import { useState } from "react";

/**
 * Abas do painel do projeto. A ordem e os nomes espelham as seções do
 * site público (Apresentação → Ambientes → Desenhos → Percurso), para que
 * a arquiteta reconheça no admin a mesma estrutura que o cliente vê.
 */
const TABS = [
  { id: "geral", label: "Identificação" },
  { id: "apresentacao", label: "Apresentação" },
  { id: "ambientes", label: "Ambientes" },
  { id: "tecnico", label: "Desenhos técnicos" },
  { id: "percurso", label: "Percurso" },
  { id: "publicacao", label: "Publicação" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function ProjectTabs({
  panels,
}: {
  panels: Record<TabId, React.ReactNode>;
}) {
  const [active, setActive] = useState<TabId>("geral");

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={
              "-mb-px border-b-2 px-4 py-2 text-sm transition-colors " +
              (active === tab.id
                ? "border-neutral-900 font-medium text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-800")
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div>{panels[active]}</div>
    </div>
  );
}
