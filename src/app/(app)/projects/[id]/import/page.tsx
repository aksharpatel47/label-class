import { ClearDatasetForm } from "@/app/(app)/projects/[id]/import/clear-dataset-form";
import { ImportDatasetForm } from "@/app/(app)/projects/[id]/import/import-dataset-form";
import { validateRequest } from "@/lib/auth/auth";
import { fetchProjectLabels } from "@/lib/data/labels";
import { ImageImportForm } from "./import-image-labels-form";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await validateRequest();
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
