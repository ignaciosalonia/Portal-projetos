/**
 * Tipos de domínio — espelham o schema em supabase/migrations, mas vivem
 * independentes do cliente Supabase. Nenhum componente de UI deve importar
 * tipos do SDK do Supabase diretamente; sempre passar por aqui.
 */

export type MembershipRole = "owner" | "admin" | "architect" | "editor";
export type ProjectStatus = "draft" | "published" | "archived";
export type StageStatus = "pending" | "current" | "completed";
export type SpecificationKind = "material" | "product";
export type MediaType =
  | "moodboard"
  | "floor_plan"
  | "render"
  | "photo"
  | "construction_photo"
  | "reference"
  | "document";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  contactEmail: string | null;
  phone: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  customDomain: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  projectType: string | null;
  heroImage: string | null;
  coverImage: string | null;
  status: ProjectStatus;
  currentStageId: string | null;
  startDate: string | null;
  estimatedCompletionDate: string | null;
  published: boolean;
  publicVisibility: boolean;
  seoIndexable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStage {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  orderIndex: number;
  status: StageStatus;
  startDate: string | null;
  expectedEndDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  description: string | null;
  zone: string | null;
  orderIndex: number;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  projectId: string;
  environmentId: string | null;
  type: MediaType;
  url: string;
  fileUrl: string | null;
  code: string | null;
  title: string | null;
  description: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface SpecificationItem {
  id: string;
  projectId: string;
  environmentId: string | null;
  kind: SpecificationKind;
  name: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  externalUrl: string | null;
  orderIndex: number;
  createdAt: string;
}

/** Projeto com relações carregadas — usado nas páginas públicas e no admin. */
export interface ProjectWithRelations extends Project {
  stages: ProjectStage[];
  environments: Environment[];
  media: Media[];
  specificationItems: SpecificationItem[];
}
