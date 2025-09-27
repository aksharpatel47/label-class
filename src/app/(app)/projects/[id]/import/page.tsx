import { ClearDatasetForm } from "@/app/(app)/projects/[id]/import/clear-dataset-form";
import { ImportDatasetForm } from "@/app/(app)/projects/[id]/import/import-dataset-form";
import { validateRequest } from "@/lib/auth/auth";
import { fetchTrainedModels } from "@/lib/data/inferences";
import { fetchProjectLabels } from "@/lib/data/labels";
import { ImageImportForm } from "./import-image-labels-form";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const result = await validateRequest();
  const trainedModels = await fetchTrainedModels();
  const projectLabels = await fetchProjectLabels(params.id);
  return (
    <div className="flex gap-4">
      <ImageImportForm
        userId={result!.user.id}
        projectId={params.id}
        projectLabels={projectLabels}
      />
      <ImportDatasetForm projectId={params.id} projectLabels={projectLabels} />
      <ClearDatasetForm projectId={params.id} projectLabels={projectLabels} />
    </div>
  );
}
