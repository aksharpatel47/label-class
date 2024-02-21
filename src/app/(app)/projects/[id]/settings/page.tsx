import { EditProjectForm } from "@/app/(app)/projects/[id]/settings/form";
import { fetchProjectById } from "@/lib/data/projects";

export default async function Page({ params }: { params: { id: string } }) {
  const project = await fetchProjectById(params.id);
  return (
    <div>
      <EditProjectForm project={project!} />
    </div>
  );
}
