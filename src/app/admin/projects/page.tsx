import { getCurrentUserMemberships } from "@/lib/repositories/admin";
import { listProjectsForOrganization } from "@/lib/repositories/admin";
import { NewProjectForm } from "./new-project-form";
import { ProjectListItem } from "./project-list-item";

export default async function ProjectsPage() {
  const memberships = await getCurrentUserMemberships();
  const organization = memberships[0]?.organization;

  if (!organization) return null; // layout já trata o caso "sem organização"

  const projects = await listProjectsForOrganization(organization.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light">Projetos</h1>
      </div>

      <NewProjectForm organizationId={organization.id} />

      <ul className="divide-y rounded border bg-white">
        {projects.length === 0 && (
          <li className="p-4 text-sm text-neutral-500">
            Nenhum projeto ainda.
          </li>
        )}
        {projects.map((project) => (
          <ProjectListItem
            key={project.id}
            project={project}
            publicPath={`/p/${organization.slug}/${project.slug}`}
          />
        ))}
      </ul>
    </div>
  );
}
