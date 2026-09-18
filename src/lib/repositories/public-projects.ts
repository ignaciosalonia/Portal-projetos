import { createClient } from "@/lib/supabase/server";
import type {
  Environment,
  Media,
  Organization,
  ProjectStage,
  ProjectWithRelations,
  SpecificationItem,
} from "@/domain/types";

/**
 * Camada de persistência para a experiência PÚBLICA (microsite).
 * Depende apenas de RLS para restringir a projetos publicados e visíveis —
 * nenhuma lógica de negócio de visibilidade é reimplementada aqui.
 */

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
    customDomain: (row.custom_domain as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getPublicOrganizationBySlug(
  slug: string,
): Promise<Organization | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return mapOrganization(data);
}

export async function getPublicProjectBySlug(
  organizationSlug: string,
  projectSlug: string,
): Promise<ProjectWithRelations | null> {
  const supabase = await createClient();

  const organization = await getPublicOrganizationBySlug(organizationSlug);
  if (!organization) return null;

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("slug", projectSlug)
    .eq("published", true)
    .eq("public_visibility", true)
    .maybeSingle();

  if (error || !project) return null;

  const [
    { data: stages },
    { data: environments },
    { data: mediaRows },
    { data: specRows },
  ] = await Promise.all([
    supabase
      .from("project_stages")
      .select("*")
      .eq("project_id", project.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("environments")
      .select("*")
      .eq("project_id", project.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("media")
      .select("*")
      .eq("project_id", project.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("specification_items")
      .select("*")
      .eq("project_id", project.id)
      .order("order_index", { ascending: true }),
  ]);

  return {
    id: project.id,
    organizationId: project.organization_id,
    name: project.name,
    slug: project.slug,
    subtitle: project.subtitle,
    description: project.description,
    city: project.city,
    state: project.state,
    country: project.country,
    projectType: project.project_type,
    heroImage: project.hero_image,
    coverImage: project.cover_image,
    status: project.status,
    currentStageId: project.current_stage_id,
    startDate: project.start_date,
    estimatedCompletionDate: project.estimated_completion_date,
    published: project.published,
    publicVisibility: project.public_visibility,
    seoIndexable: project.seo_indexable,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    stages: (stages ?? []).map(
      (s): ProjectStage => ({
        id: s.id,
        projectId: s.project_id,
        name: s.name,
        description: s.description,
        orderIndex: s.order_index,
        status: s.status,
        startDate: s.start_date,
        expectedEndDate: s.expected_end_date,
        completedAt: s.completed_at,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }),
    ),
    environments: (environments ?? []).map(
      (e): Environment => ({
        id: e.id,
        projectId: e.project_id,
        name: e.name,
        slug: e.slug,
        description: e.description,
        zone: e.zone,
        orderIndex: e.order_index,
        coverImage: e.cover_image,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      }),
    ),
    media: (mediaRows ?? []).map(
      (m): Media => ({
        id: m.id,
        projectId: m.project_id,
        environmentId: m.environment_id,
        type: m.type,
        url: m.url,
        fileUrl: m.file_url,
        code: m.code,
        title: m.title,
        description: m.description,
        orderIndex: m.order_index,
        createdAt: m.created_at,
      }),
    ),
    specificationItems: (specRows ?? []).map(
      (s): SpecificationItem => ({
        id: s.id,
        projectId: s.project_id,
        environmentId: s.environment_id,
        kind: s.kind,
        name: s.name,
        brand: s.brand,
        category: s.category,
        description: s.description,
        externalUrl: s.external_url,
        orderIndex: s.order_index,
        createdAt: s.created_at,
      }),
    ),
  };
}
