import type { Metadata } from "next";
import "./globals.css";

// Tipografia da identidade visual real da Amanda Pioner: DM Sans (corpo) e
// Playfair Display como equivalente livre do serifado editorial da marca
// (Manison, fonte paga, usada no material de portfólio). Carregadas via
// <link> em vez de next/font para não depender de rede no build local.

export const metadata: Metadata = {
  title: "Portal de Projetos",
  description: "Microsites de projetos de arquitetura",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router: layout raiz é o local correto para <link> de fontes */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
