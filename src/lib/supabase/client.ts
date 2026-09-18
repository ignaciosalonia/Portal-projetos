import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Client Components.
 * Usa apenas a anon key — nunca a service role key no browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
