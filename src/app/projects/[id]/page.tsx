import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchNumberOfTasksInProject,
  fetchTasksInProject,
} from "@/lib/data/tasks";
import Image from "next/image";
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
  const projectId = parseInt(params.id, 10);
  const currentPage = Number(searchParams.page) || 1;
  const totalTasks = await fetchNumberOfTasksInProject(projectId);
  const imagesPerPage = 50;
  const totalPages = Math.ceil(totalTasks / imagesPerPage);

  return (
    <>
      <Pagination totalPages={totalPages} />
      <Suspense fallback={<div>Loading...</div>}>
        <ImageTable projectId={projectId} currentPage={currentPage} />
      </Suspense>
    </>
  );
}
