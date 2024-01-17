import { fetchNumberOfTasksInProject } from "@/lib/data/tasks";
import { Pagination } from "./pagination";
import { ImageTable } from "./imagetable";
import { fetchProjectLabels } from "@/lib/data/labels";
import { taskLabelValue } from "@/db/schema";

export default async function Page({ params }: { params: { id: string } }) {
  const totalTasks = await fetchNumberOfTasksInProject(params.id);
  const labels = await fetchProjectLabels(params.id);
  const imagesPerPage = 50;
  const totalPages = Math.ceil(totalTasks / imagesPerPage);

  return (
    <>
      <Pagination totalPages={totalPages} />
      <ImageTable
        projectId={params.id}
        projectLabels={labels}
        taskLabelValues={taskLabelValue.enumValues}
      />
    </>
  );
}
