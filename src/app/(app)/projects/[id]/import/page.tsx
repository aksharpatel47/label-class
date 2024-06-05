import { ImageImportForm } from "./import-image-labels-form";
import { getPageSession } from "@/app/lib/utils/session";
import { fetchTrainedModels } from "@/lib/data/inferences";
import { fetchProjectLabels } from "@/lib/data/labels";
import { ImportDatasetForm } from "@/app/(app)/projects/[id]/import/import-dataset-form";
import { ClearDatasetForm } from "@/app/(app)/projects/[id]/import/clear-dataset-form";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getPageSession();
  const trainedModels = await fetchTrainedModels();
  const projectLabels = await fetchProjectLabels(params.id);
  return (
    <div className="flex gap-4">
      <ImageImportForm
        userId={session!.user.id}
        projectId={params.id}
        projectLabels={projectLabels}
      />
      <ImportDatasetForm projectId={params.id} projectLabels={projectLabels} />
      <ClearDatasetForm projectId={params.id} projectLabels={projectLabels} />
    </div>
  );
}
