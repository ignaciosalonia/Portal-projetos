/**
 * Endereço antigo, sem token. Existia antes de o acesso exigir o trecho
 * aleatório; links desse formato podem estar em conversas antigas. Em vez
 * de um 404 seco, explica o que aconteceu — sem confirmar se o projeto
 * existe, para não servir de sonda.
 */
export default function OutdatedLinkPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="font-serif text-2xl">Este link está desatualizado</h1>
        <p className="text-sm text-neutral-600">
          O endereço de acompanhamento dos projetos mudou. Peça ao escritório
          o link atualizado da apresentação.
        </p>
      </div>
    </main>
  );
}
