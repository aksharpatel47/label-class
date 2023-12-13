import { fetchNumberOfTasksInProject } from "@/lib/data/tasks";
import { Pagination } from "./pagination";
import { ImageTable } from "./imagetable";
import { Suspense } from "react";

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const currentPage = Number(searchParams.page) || 1;
  const totalTasks = await fetchNumberOfTasksInProject(params.id);
  const imagesPerPage = 50;
  const totalPages = Math.ceil(totalTasks / imagesPerPage);

  return (
    <>
      <Pagination totalPages={totalPages} />
      <Suspense fallback={<div>Loading...</div>}>
        <ImageTable projectId={params.id} currentPage={currentPage} />
      </Suspense>
    </>
  );
}
