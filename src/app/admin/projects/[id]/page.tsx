import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCurrentUserMemberships,
  getProjectById,
  listEnvironments,
  listMedia,
  listSpecificationItems,
  listStages,
} from "@/lib/repositories/admin";
import { ProjectGeneralForm } from "./project-general-form";
import { PublicationPanel } from "./publication-panel";
import { StagesPanel } from "./stages-panel";
import { EnvironmentsPanel } from "./environments-panel";
import {
  MoodboardPanel,
  EnvironmentMediaPanel,
  TechnicalPanel,
} from "./media-panel";
import { SpecificationsPanel } from "./specifications-panel";
import { PublicLinkPanel } from "./public-link-panel";
import { ProjectTabs } from "./project-tabs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) notFound();

  const [stages, environments, media, specificationItems, memberships] =
    await Promise.all([
      listStages(project.id),
      listEnvironments(project.id),
      listMedia(project.id),
      listSpecificationItems(project.id),
      getCurrentUserMemberships(),
    ]);

  const organization = memberships.find(
    (m) => m.organizationId === project.organizationId,
  )?.organization;
  const generalSpecs = specificationItems.filter((s) => !s.environmentId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/projects"
          className="text-sm text-neutral-500 underline"
        >
          ← Projetos
        </Link>
        <h1 className="text-2xl font-light">{project.name}</h1>
      </div>

      {organization && (
        <PublicLinkPanel project={project} orgSlug={organization.slug} />
      )}

      <ProjectTabs
        panels={{
          geral: <ProjectGeneralForm project={project} />,
          apresentacao: (
            <div className="space-y-6">
              <MoodboardPanel
                projectId={project.id}
                media={media}
                heroImage={project.heroImage}
              />
              <SpecificationsPanel
                projectId={project.id}
                items={generalSpecs}
                environments={[]}
                title="Materiais e equipamentos gerais"
                hint="Aparecem em um bloco retrátil logo abaixo da apresentação."
              />
            </div>
          ),
          ambientes: (
            <div className="space-y-6">
              <EnvironmentsPanel
                projectId={project.id}
                environments={environments}
              />
              <EnvironmentMediaPanel
                projectId={project.id}
                media={media}
                environments={environments}
                heroImage={project.heroImage}
              />
              <SpecificationsPanel
                projectId={project.id}
                items={specificationItems.filter((s) => s.environmentId)}
                environments={environments}
                title="Materiais e produtos por ambiente"
                hint="Aparecem em um bloco retrátil abaixo das imagens do ambiente."
              />
            </div>
          ),
          tecnico: (
            <TechnicalPanel
              projectId={project.id}
              media={media}
              heroImage={project.heroImage}
            />
          ),
          percurso: <StagesPanel projectId={project.id} stages={stages} />,
          publicacao: <PublicationPanel project={project} />,
        }}
      />
    </div>
  );
}
