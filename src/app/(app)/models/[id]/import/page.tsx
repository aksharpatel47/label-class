import { ImportInferenceForm } from "@/app/(app)/models/[id]/import/import-inference-form";

export default async function Page({ params }: { params: { id: string } }) {
  return (
    <div className="m-4">
      <ImportInferenceForm modelId={Number(params.id)} />
    </div>
  );
}
