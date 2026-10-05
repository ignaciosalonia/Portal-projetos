import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Mantém o projeto do Supabase ativo.
 *
 * O plano gratuito do Supabase pausa o projeto após 7 dias sem atividade, e
 * aí o site para de funcionar até alguém reativar no painel. O agendador da
 * Vercel (vercel.json) chama esta rota uma vez por dia; a consulta mínima
 * abaixo conta como atividade.
 *
 * Usa a chave pública e lê só o que já é público (slug das organizações),
 * então a rota não expõe nada. Se CRON_SECRET estiver definida na Vercel,
 * só o agendador consegue chamar.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );

  const { error } = await supabase.from("organizations").select("slug").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, em: new Date().toISOString() });
}
