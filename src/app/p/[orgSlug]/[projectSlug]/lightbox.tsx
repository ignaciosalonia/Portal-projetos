"use client";

import { useEffect, useState } from "react";

/**
 * Abre a imagem em tela cheia por cima da página (sem nova aba). Necessário
 * porque as imagens da galeria são recortadas em proporção fixa para manter
 * a grade uniforme — o lightbox devolve a imagem inteira, sem corte.
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
        <img src={src} alt={alt} className={className} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-brand-charcoal/95 p-4 md:p-8"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="absolute right-4 top-4 text-3xl leading-none text-brand-cream md:right-7 md:top-6"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full cursor-default object-contain"
          />
        </div>
      )}
    </>
  );
}
