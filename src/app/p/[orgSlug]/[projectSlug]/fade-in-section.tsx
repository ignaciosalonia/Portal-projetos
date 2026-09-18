"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "fade" | "slide-left" | "slide-right" | "zoom";

const HIDDEN_CLASS: Record<Variant, string> = {
  fade: "opacity-0 translate-y-6",
  "slide-left": "opacity-0 -translate-x-8",
  "slide-right": "opacity-0 translate-x-8",
  zoom: "opacity-0 scale-95",
};

const VISIBLE_CLASS = "opacity-100 translate-y-0 translate-x-0 scale-100";

/**
 * Envolve uma seção e revela seu conteúdo ao entrar na viewport — padrão
 * observado no material de referência (Senna Building). Usa
 * IntersectionObserver, sem dependências. `variant` permite variar o tipo
 * de entrada por seção (texto desliza lateral, imagens têm leve zoom, etc.)
 * em vez de um fade uniforme em tudo.
 */
export function FadeInSection({
  children,
  className,
  variant = "fade",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      ref={ref}
      className={
        "transition-all duration-700 ease-out " +
        (visible ? VISIBLE_CLASS : HIDDEN_CLASS[variant]) +
        (className ? ` ${className}` : "")
      }
    >
      {children}
    </div>
  );
}
