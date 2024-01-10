import { getPageSession } from "@/app/lib/utils/session";
import { fetchTasksForLabeling } from "@/lib/data/tasks";
import { TaskTool } from "./tasktool";
import { fetchProjectLabels } from "@/lib/data/labels";
import { taskLabelValue } from "@/db/schema";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getPageSession();
  const tasks = await fetchTasksForLabeling(session!.user.id, params.id);
  const labels = await fetchProjectLabels(params.id);
  return (
    <TaskTool
      tasks={tasks}
      labels={labels}
      projectId={params.id}
      labelValues={taskLabelValue.enumValues}
    />
  );
}
