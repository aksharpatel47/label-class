import { SelectionForm } from "@/app/(app)/projects/[id]/selection/form";
import { fetchTrainedModels } from "@/lib/data/inferences";
import { fetchProjectLabels } from "@/lib/data/labels";

export default async function Page({ params }: { params: { id: string } }) {
  const inferenceModels = await fetchTrainedModels();
  const projectLabels = await fetchProjectLabels(params.id);
  return (
    <div className="flex flex-col gap-2">
      <div>
        Use this page to figure out the distribution of images and how many
        images are still left to label.
      </div>
      <SelectionForm
        trainedModels={inferenceModels}
        projectLabels={projectLabels}
        projectId={params.id}
      />
    </div>
  );
}
