import { ModelInferenceMatrixProjectForm } from "@/app/(app)/components/model-inference-matrix-project-form";
import { H4 } from "@/components/ui/typography";
import {
  fetchProjectLabelNames,
  fetchProjects,
  fetchProjectsWithLabelName,
} from "@/lib/data/projects";
import { InferenceTables } from "./InferenceTables";

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { selectedProject?: string[]; labelName?: string };
}) {
  const modelId = parseInt(params.id);
  const projects = await fetchProjects();
  const projectLabelNames = await fetchProjectLabelNames();
  const projectsWithSelectedLabelName = searchParams.labelName
    ? await fetchProjectsWithLabelName(searchParams.labelName)
    : [];

  return (
    <div>
      <div className="flex gap-8">
        <div className="w-[400px]">
          <H4>Projects</H4>
          <ModelInferenceMatrixProjectForm
            projects={projects}
            projectLabelNames={projectLabelNames}
            allProjectsWithSelectedLabelName={projectsWithSelectedLabelName}
          />
        </div>
        {searchParams.labelName && (
          <InferenceTables
            selectedProjects={
              searchParams.selectedProject ||
              projectsWithSelectedLabelName.map((p) => p.id)
            }
            trainedModelId={modelId}
            labelName={searchParams.labelName}
          />
        )}
      </div>
    </div>
  );
}
