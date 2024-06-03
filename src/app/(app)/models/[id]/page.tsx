import { fetchTrainedModelById } from "@/lib/data/inferences";
import { H1, H4 } from "@/components/ui/typography";
import { InferenceTables } from "./InferenceTables";
import { ModelInferenceMatrixProjectForm } from "@/app/(app)/models/[id]/form";
import { fetchProjectLabelNames, fetchProjects } from "@/lib/data/projects";

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { selectedProject: string[]; labelName: string };
}) {
  const modelId = parseInt(params.id);
  const model = await fetchTrainedModelById(modelId);
  const projects = await fetchProjects();
  const projectLabelNames = await fetchProjectLabelNames();

  if (!model) {
    return <div>{`Model doesn't exist.`}</div>;
  }

  return (
    <div>
      <H1>{model.name}</H1>
      <div className="h-4"></div>
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
