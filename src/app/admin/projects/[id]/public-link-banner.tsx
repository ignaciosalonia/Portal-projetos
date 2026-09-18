"use client";

import { useState } from "react";

export function PublicLinkBanner({
  publicPath,
  isLive,
}: {
  publicPath: string;
  isLive: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}${publicPath}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (!isLive) {
    return (
      <div className="rounded border border-dashed bg-neutral-50 p-3 text-sm text-neutral-500">
        O link público aparecerá aqui assim que o projeto for publicado e
        marcado como acessível por link (painel de Publicação, abaixo).
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded border bg-white p-3">
      <div>
        <p className="text-xs text-neutral-500">Link público</p>
        <code className="text-sm">{publicPath}</code>
      </div>
      <div className="flex gap-3">
        <a
          href={publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-neutral-700 underline"
        >
          Abrir
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="text-sm text-neutral-700 underline"
        >
          {copied ? "Copiado!" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
