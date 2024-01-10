import { fetchNumberOfTasksInProject } from "@/lib/data/tasks";
import { Pagination } from "./pagination";
import { ImageTable } from "./imagetable";
import { Suspense } from "react";
import { fetchUsers } from "@/lib/data/users";
import { fetchProjectLabels } from "@/lib/data/labels";
import { taskLabelValue } from "@/db/schema";

export default async function Page({ params }: { params: { id: string } }) {
  const totalTasks = await fetchNumberOfTasksInProject(params.id);
  const labels = await fetchProjectLabels(params.id);
  const users = await fetchUsers();
  const imagesPerPage = 50;
  const totalPages = Math.ceil(totalTasks / imagesPerPage);

  return (
    <>
      <Pagination totalPages={totalPages} />
      <ImageTable
        projectId={params.id}
        users={users}
        projectLabels={labels}
        taskLabelValues={taskLabelValue.enumValues}
      />
    </>
  );
}
