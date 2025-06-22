import { ModelInferenceMatrixProjectForm } from "@/app/(app)/components/model-inference-matrix-project-form";
import { H4 } from "@/components/ui/typography";
import { fetchProjectLabelNames, fetchProjects } from "@/lib/data/projects";
import { InferenceTables } from "./InferenceTables";

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { selectedProject: string[]; labelName: string };
}) {
  const modelId = parseInt(params.id);
  const projects = await fetchProjects();
  const projectLabelNames = await fetchProjectLabelNames();

  return (
    <div>
      <div className="flex gap-8">
        <div className="w-[400px]">
          <H4>Projects</H4>
          <ModelInferenceMatrixProjectForm
            projects={projects}
            projectLabelNames={projectLabelNames}
          />
        </div>
        <InferenceTables
          selectedProjects={searchParams.selectedProject}
          trainedModelId={modelId}
          labelName={searchParams.labelName}
        />
      </div>
    </div>
  );
}
