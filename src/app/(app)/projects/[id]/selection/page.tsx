import { SelectionForm } from "@/app/(app)/projects/[id]/selection/form";
import { fetchTrainedModels } from "@/lib/data/inferences";
import { fetchProjectLabels } from "@/lib/data/labels";
import { ImageInferenceTypes } from "@/app/lib/models/image";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const inferenceModels = await fetchTrainedModels();
  const projectLabels = await fetchProjectLabels(params.id);
  return (
    <div className="flex flex-col gap-2">
      <div>
        Use this page to add images to your dataset based on the inference
        output of trained model.
      </div>
      <SelectionForm
        trainedModels={inferenceModels}
        projectLabels={projectLabels}
        projectId={params.id}
        imageInferenceTypes={ImageInferenceTypes}
      />
    </div>
  );
}
