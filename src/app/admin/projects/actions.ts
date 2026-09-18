"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const createProjectSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2, "Nome muito curto"),
  city: z.string().optional(),
  state: z.string().optional(),
});

export interface FormActionState {
  error: string | null;
}

export async function createProjectAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = createProjectSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const slug = slugify(parsed.data.name);

  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: parsed.data.organizationId,
      name: parsed.data.name,
      slug,
      city: parsed.data.city ?? null,
      state: parsed.data.state ?? null,
      status: "draft",
      published: false,
      public_visibility: false,
      seo_indexable: false,
    })
    .select("id")
    .single();

  // RLS bloqueia silenciosamente organizações às quais o usuário não
  // pertence: um erro aqui pode ser tanto falha de validação quanto
  // tentativa de acesso indevido — tratamos ambos como erro genérico.
  if (error || !data) {
    return { error: "Não foi possível criar o projeto." };
  }

  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${data.id}`);
}

const updateProjectGeneralSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  projectType: z.string().optional(),
});

export async function updateProjectGeneralAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = updateProjectGeneralSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    subtitle: formData.get("subtitle") || undefined,
    description: formData.get("description") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    country: formData.get("country") || undefined,
    projectType: formData.get("projectType") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { projectId, ...fields } = parsed.data;

  const { error } = await supabase
    .from("projects")
    .update({
      name: fields.name,
      subtitle: fields.subtitle ?? null,
      description: fields.description ?? null,
      city: fields.city ?? null,
      state: fields.state ?? null,
      country: fields.country ?? null,
      project_type: fields.projectType ?? null,
    })
    .eq("id", projectId);

  if (error) return { error: "Não foi possível salvar." };

  revalidatePath(`/admin/projects/${projectId}`);
  return { error: null };
}

/**
 * Alterna publicação/visibilidade. São ações deliberadas e explícitas —
 * nunca automáticas — conforme item 10 do briefing (nunca publicar
 * automaticamente conteúdo recém-criado).
 */
export async function setProjectPublicationAction(
  projectId: string,
  fields: { published?: boolean; publicVisibility?: boolean; seoIndexable?: boolean },
) {
  const supabase = await createClient();
  const payload: Record<string, boolean> = {};
  if (fields.published !== undefined) payload.published = fields.published;
  if (fields.publicVisibility !== undefined)
    payload.public_visibility = fields.publicVisibility;
  if (fields.seoIndexable !== undefined)
    payload.seo_indexable = fields.seoIndexable;

  const { error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", projectId);

  if (error) throw new Error("Não foi possível atualizar a publicação.");

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
}

const stageSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  orderIndex: z.coerce.number().int().min(1),
  status: z.enum(["pending", "current", "completed"]),
});

export async function createStageAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = stageSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    orderIndex: formData.get("orderIndex"),
    status: formData.get("status") ?? "pending",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_stages").insert({
    project_id: parsed.data.projectId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    order_index: parsed.data.orderIndex,
    status: parsed.data.status,
  });

  if (error) return { error: "Não foi possível criar a etapa." };

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { error: null };
}

export async function updateStageStatusAction(
  stageId: string,
  projectId: string,
  status: "pending" | "current" | "completed",
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_stages")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", stageId);

  if (error) throw new Error("Não foi possível atualizar a etapa.");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function deleteStageAction(stageId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_stages")
    .delete()
    .eq("id", stageId);

  if (error) throw new Error("Não foi possível remover a etapa.");
  revalidatePath(`/admin/projects/${projectId}`);
}

const environmentSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2),
  zone: z.string().optional(),
});

export async function createEnvironmentAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = environmentSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    zone: formData.get("zone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("environments")
    .select("*", { count: "exact", head: true })
    .eq("project_id", parsed.data.projectId);

  const { error } = await supabase.from("environments").insert({
    project_id: parsed.data.projectId,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    zone: parsed.data.zone ?? null,
    order_index: (count ?? 0) + 1,
  });

  if (error) return { error: "Não foi possível criar o ambiente." };

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return { error: null };
}

export async function deleteEnvironmentAction(
  environmentId: string,
  projectId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("environments")
    .delete()
    .eq("id", environmentId);

  if (error) throw new Error("Não foi possível remover o ambiente.");
  revalidatePath(`/admin/projects/${projectId}`);
}

/**
 * Exclui um projeto permanentemente (cascade remove ambientes, mídia,
 * etapas e especificações associadas via foreign keys). Ação irreversível
 * — a confirmação acontece na UI antes de chamar esta action.
 */
export async function deleteProjectAction(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error("Não foi possível excluir o projeto.");
  revalidatePath("/admin/projects");
}
