import { H2 } from "@/components/ui/typography";
import { ImageImportForm } from "./form";
import { getPageSession } from "@/app/lib/utils/session";
import { ImportInferenceForm } from "./import.inference.form";
import { fetchTrainedModels } from "@/lib/data/inferences";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getPageSession();
  const trainedModels = await fetchTrainedModels();
  return (
    <>
      <H2>Import Files</H2>
      <ImageImportForm userId={session!.user.id} projectId={params.id} />
      <ImportInferenceForm
        trainedModels={trainedModels}
        projectId={params.id}
      />
    </>
  );
}
