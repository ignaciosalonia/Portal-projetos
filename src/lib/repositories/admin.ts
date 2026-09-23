import { createClient } from "@/lib/supabase/server";
import type {
  Environment,
  Media,
  Membership,
  Organization,
  Project,
  ProjectStage,
  SpecificationItem,
} from "@/domain/types";

/**
 * Camada de persistência para o painel ADMINISTRATIVO.
 * Todo acesso passa pelo cliente autenticado (cookies da sessão) — a RLS
 * garante que o usuário só enxerga/edita dados das organizações às quais
 * pertence via `memberships`. Nunca aceitar organization_id vindo de input
 * do formulário como fonte de verdade de autorização.
 */

export interface MembershipWithOrganization extends Membership {
  organization: Organization;
}

function mapOrganization(row: Record<string, unknown>): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    logoUrl: (row.logo_url as string) ?? null,
    description: (row.description as string) ?? null,
    website: (row.website as string) ?? null,
    contactEmail: (row.contact_email as string) ?? null,
    phone: (row.phone as string) ?? null,
    primaryColor: (row.primary_color as string) ?? null,
    secondaryColor: (row.secondary_color as string) ?? null,
    accentColor: (row.accent_color as string) ?? null,
    backgroundColor: (row.background_color as string) ?? null,
    surfaceColor: (row.surface_color as string) ?? null,
    fontPair: (row.font_pair as string) ?? "classico",
    tagline: (row.tagline as string) ?? null,
    showPoweredBy: (row.show_powered_by as boolean) ?? true,
    customDomain: (row.custom_domain as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    name: row.name as string,
    slug: row.slug as string,
    subtitle: (row.subtitle as string) ?? null,
    description: (row.description as string) ?? null,
    city: (row.city as string) ?? null,
    state: (row.state as string) ?? null,
    country: (row.country as string) ?? null,
    projectType: (row.project_type as string) ?? null,
    heroImage: (row.hero_image as string) ?? null,
    coverImage: (row.cover_image as string) ?? null,
    status: row.status as Project["status"],
    currentStageId: (row.current_stage_id as string) ?? null,
    startDate: (row.start_date as string) ?? null,
    estimatedCompletionDate: (row.estimated_completion_date as string) ?? null,
    published: row.published as boolean,
    publicVisibility: row.public_visibility as boolean,
    seoIndexable: row.seo_indexable as boolean,
    publicToken: row.public_token as string,
    publicAccessEnabled: (row.public_access_enabled as boolean) ?? true,
    publicAccessExpiresAt: (row.public_access_expires_at as string) ?? null,
    publicOpenedCount: (row.public_opened_count as number) ?? 0,
    publicLastOpenedAt: (row.public_last_opened_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapStage(row: Record<string, unknown>): ProjectStage {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    orderIndex: row.order_index as number,
    status: row.status as ProjectStage["status"],
    startDate: (row.start_date as string) ?? null,
    expectedEndDate: (row.expected_end_date as string) ?? null,
    completedAt: (row.completed_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapEnvironment(row: Record<string, unknown>): Environment {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? null,
    zone: (row.zone as string) ?? null,
    orderIndex: row.order_index as number,
    coverImage: (row.cover_image as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapMedia(row: Record<string, unknown>): Media {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    environmentId: (row.environment_id as string) ?? null,
    type: row.type as Media["type"],
    url: row.url as string,
    fileUrl: (row.file_url as string) ?? null,
    code: (row.code as string) ?? null,
    title: (row.title as string) ?? null,
    description: (row.description as string) ?? null,
    orderIndex: row.order_index as number,
    createdAt: row.created_at as string,
  };
}

function mapSpecificationItem(row: Record<string, unknown>): SpecificationItem {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    environmentId: (row.environment_id as string) ?? null,
    kind: row.kind as SpecificationItem["kind"],
    name: row.name as string,
    brand: (row.brand as string) ?? null,
    category: (row.category as string) ?? null,
    description: (row.description as string) ?? null,
    externalUrl: (row.external_url as string) ?? null,
    orderIndex: row.order_index as number,
    createdAt: row.created_at as string,
  };
}

export async function listMedia(projectId: string): Promise<Media[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (error || !data) return [];
  return data.map(mapMedia);
}

export async function listSpecificationItems(
  projectId: string,
): Promise<SpecificationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specification_items")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (error || !data) return [];
  return data.map(mapSpecificationItem);
}

/** Organizações às quais o usuário autenticado pertence. */
export async function getCurrentUserMemberships(): Promise<
  MembershipWithOrganization[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*, organization:organizations(*)");

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    organization: mapOrganization(
      row.organization as unknown as Record<string, unknown>,
    ),
  }));
}

export async function listProjectsForOrganization(
  organizationId: string,
): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProject(data);
}

export async function listStages(projectId: string): Promise<ProjectStage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_stages")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (error || !data) return [];
  return data.map(mapStage);
}

export async function listEnvironments(
  projectId: string,
): Promise<Environment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("environments")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (error || !data) return [];
  return data.map(mapEnvironment);
}
