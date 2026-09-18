"use client";

import { useState } from "react";
import type { SpecificationItem } from "@/domain/types";

export function SpecificationsAccordion({
  items,
  label = "Materiais e Produtos Considerados",
}: {
  items: SpecificationItem[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="border-t border-brand-greige/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left text-xs uppercase tracking-[0.3em] text-brand-sage"
        aria-expanded={open}
      >
        {label}
        <span className="text-lg text-brand-camel">{open ? "×" : "+"}</span>
      </button>

      {open && (
        <ul className="space-y-1 pb-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 border-t border-brand-greige/30 py-3"
            >
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium text-brand-charcoal">
                  {item.name}
                </span>
                <span className="text-sm text-brand-sage">
                  {[item.brand, item.category ?? item.description]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              {item.externalUrl && (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ver ${item.name}`}
                  className="shrink-0 text-brand-camel"
                >
                  ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
