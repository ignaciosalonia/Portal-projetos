/**
 * Gera a miniatura (primeira página) de um PDF, no navegador.
 *
 * Usada nos cards de desenhos técnicos: sem ela, o site tenta exibir o PDF
 * como imagem e aparece o ícone quebrado. Roda só no cliente; a biblioteca é
 * carregada sob demanda para não pesar o resto do painel.
 *
 * Nunca lança erro: se não der (PDF protegido, memória, rede), devolve null e
 * o site mostra um bloco neutro com código e título no lugar.
 */
export async function gerarMiniaturaPdf(
  origem: File | string,
  larguraMax = 1600,
): Promise<Blob | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    // Worker da mesma versão instalada, servido pelo jsDelivr.
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    const tarefa =
      typeof origem === "string"
        ? pdfjs.getDocument({ url: origem })
        : pdfjs.getDocument({ data: new Uint8Array(await origem.arrayBuffer()) });
    const pdf = await tarefa.promise;

    try {
      const pagina = await pdf.getPage(1);
      const base = pagina.getViewport({ scale: 1 });
      const escala = Math.min(4, larguraMax / base.width);
      const viewport = pagina.getViewport({ scale: escala });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await pagina.render({ canvasContext: ctx, viewport }).promise;

      return await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85),
      );
    } finally {
      await pdf.destroy();
    }
  } catch {
    return null;
  }
}
