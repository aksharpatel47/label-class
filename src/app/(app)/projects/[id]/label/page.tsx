import { taskLabelValue } from "@/db/schema";
import { fetchTrainedModels } from "@/lib/data/inferences";
import { fetchProjectLabels } from "@/lib/data/labels";
import { fetchUsers } from "@/lib/data/users";
import { LabelFilters } from "./filters";
import { Tool } from "./tool";

export default async function Page({ params }: { params: { id: string } }) {
  const labels = await fetchProjectLabels(params.id);
  const users = await fetchUsers();
  const trainedModels = await fetchTrainedModels();
  const labelValues = ["Unlabeled", ...taskLabelValue.enumValues];

  return (
    <div>
      <Tool
        projectId={params.id}
        users={users}
        trainedModels={trainedModels}
        projectLabels={labels}
        labelValues={labelValues}
      />
    </div>
  );
}
