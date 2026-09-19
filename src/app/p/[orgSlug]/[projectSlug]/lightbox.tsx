"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Abre a imagem em tela cheia por cima da página (sem nova aba). Necessário
 * porque as imagens da galeria são recortadas em proporção fixa para manter
 * a grade uniforme — o lightbox devolve a imagem inteira, sem corte.
 *
 * O overlay é renderizado via portal no <body>. Sem isso ele herdaria o
 * contexto de empilhamento das seções animadas (que usam `transform`), e
 * nesse caso `position: fixed` passa a se posicionar em relação à seção em
 * vez da tela — era o que deixava a imagem deslocada, o fundo sem rolagem
 * e o menu do topo por cima do overlay.
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
  const [zoomed, setZoomed] = useState(false);

  function close() {
    setOpen(false);
    setZoomed(false);
  }

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={close}
      className="fixed inset-0 z-[100] overflow-auto overscroll-contain bg-brand-charcoal/95"
    >
      <div className="flex min-h-full w-full items-center justify-center p-4 md:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onClick={(e) => {
            e.stopPropagation();
            setZoomed((z) => !z);
          }}
          className={
            zoomed
              ? "w-auto max-w-none cursor-zoom-out"
              : "max-h-[85svh] max-w-full cursor-zoom-in object-contain"
          }
        />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="Fechar"
        className="fixed right-3 top-3 z-[101] flex h-11 w-11 items-center justify-center rounded-full bg-brand-cream/90 text-2xl leading-none text-brand-charcoal shadow-lg md:right-6 md:top-6"
      >
        ×
      </button>

      <p className="pointer-events-none fixed inset-x-0 bottom-4 z-[101] text-center text-[10px] uppercase tracking-[0.2em] text-brand-cream/60">
        {zoomed
          ? "role para percorrer · clique na imagem para reduzir"
          : "clique na imagem para ampliar · fora para fechar"}
      </p>
    </div>
  );

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

      {/* `open` só vira true por clique, então document já existe aqui. */}
      {open ? createPortal(overlay, document.body) : null}
    </>
  );
}
