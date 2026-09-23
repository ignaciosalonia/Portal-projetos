import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserMemberships } from "@/lib/repositories/admin";
import { signOutAction } from "./login/actions";

// Nunca cachear: dados de autorização (memberships) precisam refletir o
// estado atual do banco a cada requisição, mesmo quando alterados fora da
// aplicação (ex.: diretamente via SQL).
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /admin/login não usa este layout com navegação (ver route group abaixo);
  // se chegou aqui sem usuário, o middleware já teria redirecionado, mas
  // mantemos a checagem por defesa em profundidade.
  if (!user) {
    return <>{children}</>;
  }

  const memberships = await getCurrentUserMemberships();

  if (memberships.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-lg font-medium">Sem acesso a nenhuma organização</h1>
          <p className="text-sm text-neutral-600">
            Sua conta ({user.email}) está autenticada, mas ainda não possui
            vínculo com nenhuma organização. Peça a um administrador para
            criar seu vínculo (membership).
          </p>
          <form action={signOutAction}>
            <button className="text-sm underline" type="submit">
              Sair
            </button>
          </form>
        </div>
      </main>
    );
  }

  // MVP: assume a primeira organização do usuário. Um seletor de organização
  // (para usuários com múltiplos vínculos) fica para quando houver um caso
  // de uso real — evitar complexidade prematura (ver DECISIONS.md).
  const currentOrg = memberships[0].organization;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <p className="text-sm text-neutral-500">{currentOrg.name}</p>
          <nav className="flex gap-4">
            <Link href="/admin/projects" className="font-medium">
              Projetos
            </Link>
            <Link href="/admin/marca" className="font-medium text-neutral-500">
              Identidade visual
            </Link>
          </nav>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="text-sm text-neutral-500 underline">
            Sair
          </button>
        </form>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
