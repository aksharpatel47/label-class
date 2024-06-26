import { ReactNode } from "react";
import { fetchTrainedModelById } from "@/lib/data/inferences";
import { H1 } from "@/components/ui/typography";
import { ModelNav } from "@/app/(app)/models/[id]/nav";

export default async function ModelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: {
    id: string;
  };
}) {
  const { id: modelId } = params;
  const model = await fetchTrainedModelById(Number(modelId));

  return (
    <>
      <H1>{model?.name}</H1>
      <ModelNav id={modelId} />
      {children}
    </>
  );
}
