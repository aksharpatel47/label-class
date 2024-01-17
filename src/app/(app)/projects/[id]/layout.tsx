import { H1 } from "@/components/ui/typography";
import { fetchProjectById } from "@/lib/data/projects";
import Link from "next/link";
import { ProjectNav } from "./nav";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: {
    id: string;
  };
}) {
  const { id: projectId } = params;
  const project = await fetchProjectById(projectId);
  return (
    <>
      <H1>{project?.name}</H1>
      <div className="mt-4 mb-4">
        <ProjectNav id={projectId} />
      </div>
      {children}
    </>
  );
}
