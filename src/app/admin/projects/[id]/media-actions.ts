"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { MediaType, SpecificationKind } from "@/domain/types";

export interface FormActionState {
  error: string | null;
}

const MEDIA_BUCKET = "project-media";

function slugifyFilename(name: string): string {
  const ext = name.includes(".") ? name.split(".").pop() : "";
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${crypto.randomUUID()}-${base || "arquivo"}${ext && !base.endsWith(`.${ext}`) ? "" : ""}`;
}

const uploadMediaSchema = z.object({
  projectId: z.string().uuid(),
  environmentId: z.string().uuid().optional(),
  type: z.enum([
    "moodboard",
    "floor_plan",
    "render",
    "photo",
    "construction_photo",
    "reference",
    "document",
  ]),
  code: z.string().optional(),
  title: z.string().optional(),
});

/**
 * Faz upload de um arquivo (imagem ou PDF) para o Storage e cria o registro
 * correspondente em `media`. Usa o cliente autenticado (cookies da sessão) —
 * o Storage exige suas próprias policies de RLS para aceitar o upload (ver
 * docs/DECISIONS.md, mesma lição do ADR-007 aplicada ao Storage).
 *
 * Para desenhos técnicos (type = document), o arquivo costuma ser um PDF:
 * nesse caso gravamos a URL em `file_url` (o que o card abre ao clicar) e
 * deixamos `url` como a mesma referência — a miniatura pode ser enviada
 * depois, se houver.
 */
export async function uploadMediaAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo." };
  }

  const parsed = uploadMediaSchema.safeParse({
    projectId: formData.get("projectId"),
    environmentId: formData.get("environmentId") || undefined,
    type: formData.get("type"),
    code: formData.get("code") || undefined,
    title: formData.get("title") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const path = `${parsed.data.projectId}/${slugifyFilename(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: `Não foi possível enviar o arquivo: ${uploadError.message}` };
  }

  const { data: publicUrlData } = supabase.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(path);

  const isPdf = file.type === "application/pdf";

  const { count } = await supabase
    .from("media")
    .select("*", { count: "exact", head: true })
    .eq("project_id", parsed.data.projectId);

  const { error: insertError } = await supabase.from("media").insert({
    project_id: parsed.data.projectId,
    environment_id: parsed.data.environmentId ?? null,
    type: parsed.data.type,
    url: publicUrlData.publicUrl,
    file_url: isPdf ? publicUrlData.publicUrl : null,
    code: parsed.data.code ?? null,
    title: parsed.data.title ?? null,
    order_index: (count ?? 0) + 1,
  });

  if (insertError) {
    return { error: "Upload feito, mas não foi possível salvar o registro." };
  }

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { error: null };
}

export async function deleteMediaAction(mediaId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("media").delete().eq("id", mediaId);
  if (error) throw new Error("Não foi possível remover a imagem.");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function setHeroImageAction(projectId: string, url: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ hero_image: url })
    .eq("id", projectId);
  if (error) throw new Error("Não foi possível definir a imagem de capa.");
  revalidatePath(`/admin/projects/${projectId}`);
}

// ---------------------------------------------------------------------------
// Zona do ambiente
// ---------------------------------------------------------------------------

export async function updateEnvironmentZoneAction(
  environmentId: string,
  projectId: string,
  zone: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("environments")
    .update({ zone: zone || null })
    .eq("id", environmentId);
  if (error) throw new Error("Não foi possível salvar a zona.");
  revalidatePath(`/admin/projects/${projectId}`);
}

// ---------------------------------------------------------------------------
// Materiais e produtos (specification_items)
// ---------------------------------------------------------------------------

const createSpecSchema = z.object({
  projectId: z.string().uuid(),
  environmentId: z.string().uuid().optional(),
  kind: z.enum(["material", "product"]),
  name: z.string().min(2, "Nome muito curto"),
  brand: z.string().optional(),
  category: z.string().optional(),
  externalUrl: z.string().url().optional().or(z.literal("")),
});

export async function createSpecificationItemAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = createSpecSchema.safeParse({
    projectId: formData.get("projectId"),
    environmentId: formData.get("environmentId") || undefined,
    kind: formData.get("kind") ?? "material",
    name: formData.get("name"),
    brand: formData.get("brand") || undefined,
    category: formData.get("category") || undefined,
    externalUrl: formData.get("externalUrl") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("specification_items")
    .select("*", { count: "exact", head: true })
    .eq("project_id", parsed.data.projectId);

  const { error } = await supabase.from("specification_items").insert({
    project_id: parsed.data.projectId,
    environment_id: parsed.data.environmentId ?? null,
    kind: parsed.data.kind,
    name: parsed.data.name,
    brand: parsed.data.brand ?? null,
    category: parsed.data.category ?? null,
    external_url: parsed.data.externalUrl || null,
    order_index: (count ?? 0) + 1,
  });

  if (error) return { error: "Não foi possível criar o item." };

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { error: null };
}

export async function deleteSpecificationItemAction(
  itemId: string,
  projectId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("specification_items")
    .delete()
    .eq("id", itemId);
  if (error) throw new Error("Não foi possível remover o item.");
  revalidatePath(`/admin/projects/${projectId}`);
}

export type { MediaType, SpecificationKind };
