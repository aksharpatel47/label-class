import { fetchNumberOfTasksInProject } from "@/lib/data/tasks";
import { Pagination } from "./pagination";
import { ImageTable } from "./imagetable";
import { fetchProjectLabels } from "@/lib/data/labels";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const totalTasks = await fetchNumberOfTasksInProject(params.id);
  const labels = await fetchProjectLabels(params.id);
  const imagesPerPage = 50;
  const totalPages = Math.ceil(totalTasks / imagesPerPage);

  return (
    <>
      <Pagination totalPages={totalPages} />
      <ImageTable projectId={params.id} projectLabels={labels} />
    </>
  );
}
