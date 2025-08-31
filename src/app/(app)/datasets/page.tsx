import { ModelInferenceMatrixProjectForm } from "@/app/components/model-inference-matrix-project-form";
import { getPageSession } from "@/app/lib/utils/session";
import { H4 } from "@/components/ui/typography";
import {
  fetchProjectLabelNames,
  fetchProjects,
  fetchProjectsWithLabelName,
} from "@/lib/data/projects";
import { DatasetTables } from "./dataset-tables";

export default async function Page({
  searchParams,
}: {
  searchParams: { selectedProject?: string[]; labelName?: string };
}) {
  const session = await getPageSession();
  if (!session) {
    return (
      <div className="text-red-500">
        You must be logged in to view this page.
      </div>
    );
  }
  const projects = await fetchProjects();
  const projectLabelNames = await fetchProjectLabelNames();
  const allProjectsWithSelectedLabelName = searchParams.labelName
    ? await fetchProjectsWithLabelName(searchParams.labelName)
    : [];

  return (
    <div>
      <div className="flex gap-8">
        <div className="w-[400px] flex-shrink-0">
          <H4>Projects</H4>
          <ModelInferenceMatrixProjectForm
            projects={projects}
            projectLabelNames={projectLabelNames}
            allProjectsWithSelectedLabelName={allProjectsWithSelectedLabelName}
          />
        </div>
        {searchParams.labelName && (
          <DatasetTables
            user={session.user}
            allProjects={projects}
            selectedProjects={
              searchParams.selectedProject ||
              allProjectsWithSelectedLabelName.map((p) => p.id)
            }
            labelName={searchParams.labelName}
          />
        )}
      </div>
    </div>
  );
}
