import { H1 } from "@/components/ui/typography";
import { fetchProjectById } from "@/lib/data/projects";
import { ProjectNav } from "./nav";
import type { ReactNode } from "react";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
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
