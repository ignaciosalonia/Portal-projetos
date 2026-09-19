"use client";

import { useEffect, useState } from "react";

/**
 * Abre a imagem em tela cheia por cima da página (sem nova aba). Necessário
 * porque as imagens da galeria são recortadas em proporção fixa para manter
 * a grade uniforme — o lightbox devolve a imagem inteira, sem corte.
 *
 * Medidas em svh/vw (não em %) porque `max-h-full` dentro de um container
 * flex não resolve de forma confiável, e `vh` no celular ignora a barra do
 * navegador — as duas coisas faziam a imagem estourar a tela.
 */
export function Lightbox({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in"
        aria-label={`Ampliar ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={className}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] flex cursor-zoom-out flex-col items-center justify-center bg-brand-charcoal/95"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-brand-cream/90 text-2xl leading-none text-brand-charcoal shadow-lg md:right-6 md:top-6"
          >
            ×
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[82svh] max-w-[92vw] cursor-default object-contain shadow-2xl md:max-h-[86svh] md:max-w-[88vw]"
          />

          <p className="pointer-events-none mt-4 text-[10px] uppercase tracking-[0.2em] text-brand-cream/70">
            toque fora para fechar
          </p>
        </div>
      )}
    </>
  );
}
