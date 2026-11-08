import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Imagens e PDFs do projeto vão direto do navegador para o Storage e não
      // passam por aqui. Este limite cobre o que ainda usa Server Action com
      // arquivo (logo do escritório). Teto da Vercel: 4,5 MB por requisição.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
