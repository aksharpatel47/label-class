import { ClearDatasetForm } from "@/app/(app)/projects/[id]/import/clear-dataset-form";
import { ImportDatasetForm } from "@/app/(app)/projects/[id]/import/import-dataset-form";
import { fetchProjectLabels } from "@/lib/data/labels";
import { ImageImportForm } from "./import-image-labels-form";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const projectLabels = await fetchProjectLabels(params.id);
  return (
    <div className="flex gap-4">
      <ImageImportForm
        projectId={params.id}
        projectLabels={projectLabels}
      />
      <ImportDatasetForm projectId={params.id} projectLabels={projectLabels} />
      <ClearDatasetForm projectId={params.id} projectLabels={projectLabels} />
    </div>
  );
}
