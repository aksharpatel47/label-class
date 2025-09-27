import { ReactNode } from "react";
import { fetchTrainedModelById } from "@/lib/data/inferences";
import { H1 } from "@/components/ui/typography";
import { ModelNav } from "@/app/(app)/models/[id]/nav";

export default async function ModelLayout(
  props: {
    children: ReactNode;
    params: Promise<{
      id: string;
    }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const { id: modelId } = params;
  const model = await fetchTrainedModelById(Number(modelId));

  return (
    <>
      <H1>
        {model?.name +
          " (" +
          model?.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }) +
          ")"}
      </H1>
      <ModelNav id={modelId} />
      {children}
    </>
  );
}
