"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { FONT_PAIR_KEYS } from "@/lib/branding";

export interface FormActionState {
  error: string | null;
  ok?: boolean;
}

const LOGO_BUCKET = "project-media";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor no formato #RRGGBB");

const brandingSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2, "Nome muito curto"),
  tagline: z.string().optional(),
  fontPair: z.enum(FONT_PAIR_KEYS as [string, ...string[]]),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  accentColor: hexColor,
  backgroundColor: hexColor,
  surfaceColor: hexColor,
  showPoweredBy: z.boolean(),
});

export async function updateBrandingAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = brandingSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    tagline: formData.get("tagline") || undefined,
    fontPair: formData.get("fontPair"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    accentColor: formData.get("accentColor"),
    backgroundColor: formData.get("backgroundColor"),
    surfaceColor: formData.get("surfaceColor"),
    showPoweredBy: formData.get("showPoweredBy") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { organizationId, ...fields } = parsed.data;

  // A RLS restringe a atualização às organizações às quais o usuário
  // pertence — o organizationId do formulário não é fonte de autorização.
  const { error } = await supabase
    .from("organizations")
    .update({
      name: fields.name,
      tagline: fields.tagline ?? null,
      font_pair: fields.fontPair,
      primary_color: fields.primaryColor,
      secondary_color: fields.secondaryColor,
      accent_color: fields.accentColor,
      background_color: fields.backgroundColor,
      surface_color: fields.surfaceColor,
      show_powered_by: fields.showPoweredBy,
    })
    .eq("id", organizationId);

  if (error) return { error: "Não foi possível salvar a identidade visual." };

  revalidatePath("/admin/marca");
  revalidatePath("/admin/projects");
  return { error: null, ok: true };
}

function logoPath(organizationId: string, fileName: string): string {
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()!.toLowerCase()
    : "png";
  return `logos/${organizationId}-${Date.now()}.${ext}`;
}

export async function uploadLogoAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const file = formData.get("file");
  const organizationId = String(formData.get("organizationId") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo." };
  }
  if (!organizationId) {
    return { error: "Organização não identificada." };
  }

  const supabase = await createClient();
  const path = logoPath(organizationId, file.name);

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: `Não foi possível enviar o logo: ${uploadError.message}` };
  }

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);

  const { error } = await supabase
    .from("organizations")
    .update({ logo_url: data.publicUrl })
    .eq("id", organizationId);

  if (error) return { error: "Logo enviado, mas não foi possível salvar." };

  revalidatePath("/admin/marca");
  return { error: null, ok: true };
}

export async function removeLogoAction(organizationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ logo_url: null })
    .eq("id", organizationId);

  if (error) throw new Error("Não foi possível remover o logo.");
  revalidatePath("/admin/marca");
}
