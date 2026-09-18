export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center">
      <h1 className="text-2xl font-light">Portal de Projetos</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-500">
        Plataforma de microsites para escritórios de arquitetura. Acesse o{" "}
        <a href="/admin/login" className="underline">
          painel administrativo
        </a>
        .
      </p>
    </main>
  );
}
