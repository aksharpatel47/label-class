import { ImportInferenceForm } from "@/app/(app)/models/[id]/import/import-inference-form";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <div className="m-4">
      <ImportInferenceForm modelId={Number(params.id)} />
    </div>
  );
}
