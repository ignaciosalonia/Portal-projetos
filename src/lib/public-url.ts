/**
 * Link enviado ao cliente.
 *
 * Escritórios com domínio próprio recebem o formato curto
 * (dominio/<projeto>/<token>); o next.config.ts reescreve esse endereço para a
 * rota interna /p/<escritorio>/<projeto>/<token>. Os demais usam o formato longo.
 */
export const DOMINIOS: Record<string, string> = {
  "amanda-arquitetura": "https://amandapioner.vercel.app",
};

export function linkDoCliente(orgSlug: string, slug: string, token: string) {
  const dominio = DOMINIOS[orgSlug];
  return dominio
    ? `${dominio}/${slug}/${token}`
    : `https://portal-projetos-vert.vercel.app/p/${orgSlug}/${slug}/${token}`;
}
