import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Imagens e PDFs vão direto do navegador para o Storage; este limite
      // cobre só o logo do escritório. Teto da Vercel: 4,5 MB.
      bodySizeLimit: "4mb",
    },
  },
  // Domínio próprio do escritório: amandapioner.vercel.app/<projeto>/<token>
  // abre a rota interna /p/amanda-arquitetura/<projeto>/<token>.
  // Ver src/lib/public-url.ts. "admin", "api" e "p" ficam de fora.
  async rewrites() {
    return [
      {
        source: "/:slug((?!admin|api|p$)[^/]+)/:token",
        has: [{ type: "host", value: "amandapioner.vercel.app" }],
        destination: "/p/amanda-arquitetura/:slug/:token",
      },
    ];
  },
};

export default nextConfig;
