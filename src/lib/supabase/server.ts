import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Propaga a sessão via cookies; a autorização real é sempre feita pelas
 * policies de RLS no banco — este cliente nunca deve usar a service role key.
 *
 * IMPORTANTE: um cliente recém-criado não hidrata a sessão automaticamente
 * antes da primeira query — sem isso, consultas a tabelas com RLS rodam
 * como anônimo (auth.uid() = null) mesmo com cookies de sessão válidos.
 * Por isso chamamos getUser() aqui, uma única vez, para todo consumidor.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll chamado a partir de um Server Component sem middleware
            // de refresh de sessão — seguro ignorar se houver middleware.
          }
        },
      },
    },
  );

  await supabase.auth.getUser();

  return supabase;
}
