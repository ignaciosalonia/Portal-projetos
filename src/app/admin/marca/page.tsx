import { getCurrentUserMemberships } from "@/lib/repositories/admin";
import { BrandingForm } from "./branding-form";

export default async function BrandingPage() {
  const memberships = await getCurrentUserMemberships();
  const organization = memberships[0]?.organization;

  if (!organization) return null; // layout já trata o caso "sem organização"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light">Identidade visual</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Define como os microsites deste escritório aparecem para os clientes.
          Vale para todos os projetos, publicados ou não.
        </p>
      </div>

      <BrandingForm organization={organization} />
    </div>
  );
}
