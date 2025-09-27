import { Tool } from "@/app/components/tool";
import { taskLabelValue } from "@/db/schema";
import { fetchTrainedModels } from "@/lib/data/inferences";
import { fetchProjectLabels } from "@/lib/data/labels";
import { fetchUsers } from "@/lib/data/users";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const labels = await fetchProjectLabels(params.id);
  const users = await fetchUsers();
  const trainedModels = await fetchTrainedModels(false);
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
