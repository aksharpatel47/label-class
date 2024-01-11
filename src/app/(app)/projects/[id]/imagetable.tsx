"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchTasksInProject } from "@/lib/data/tasks";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import useSwr from "swr";
import { UserDropdown } from "./filters";
import {
  AuthUser,
  ProjectLabel,
  TaskLabelValue,
  projectLabels,
  taskLabelValue,
} from "@/db/schema";
import { TaskTool } from "./tasktool";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useEffect } from "react";
import next from "next";
import PreviousMap from "postcss/lib/previous-map";

const fetcher = (...args: any[]) =>
  fetch.apply(null, args as any).then((res) => res.json());

type State = {
  index: number;
};

type Actions = {
  next(): void;
  prev(): void;
};

const useImageTableStore = create<State & Actions>()(
  immer((set) => ({
    index: 0,
    next: () => {
      set((state) => {
        state.index++;
      });
    },
    prev: () => {
      set((state) => {
        state.index--;
      });
    },
  }))
);

export function ImageTable(props: {
  projectId: string;
  users: AuthUser[];
  projectLabels: ProjectLabel[];
  taskLabelValues: TaskLabelValue;
}) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const currentUser = searchParams.get("user") || undefined;
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.set("page", page.toString());
  if (currentUser) {
    urlSearchParams.set("user", currentUser);
  }
  const url = `/api/projects/${
    props.projectId
  }/tasks?${urlSearchParams.toString()}`;

  function handleKeyDown(e: KeyboardEvent) {
    console.log(e.key);
    if (e.key === "ArrowRight") {
      next();
    } else if (e.key === "ArrowLeft") {
      prev();
    }
  }

  const { index, next, prev } = useImageTableStore();
  const { data, error, isLoading } = useSwr(url, fetcher);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  if (isLoading) {
    return (
      <div className="flex justify-center m-8">
        <p className="text-gray-500 text-2xl">Loading images...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex justify-center m-8">
        <p className="text-gray-500 text-2xl">No images to show</p>
      </div>
    );
  }

  console.log(`The current index is ${index}`);
  console.log(`The current task is ${JSON.stringify(data[index])}`);

  return (
    <>
      <UserDropdown users={props.users} />
      <div className="flex gap-8">
        <div className="w-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>File Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((task: any) => (
                <TableRow key={task.tasks.id}>
                  <TableCell className="font-medium">
                    <Image
                      src={task.tasks.imageUrl}
                      alt={task.tasks.name}
                      height={50}
                      width={50}
                    />
                  </TableCell>
                  <TableCell>{task.tasks.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <TaskTool
          projectId={props.projectId}
          task={data[index].tasks}
          labels={props.projectLabels}
          labelValues={props.taskLabelValues}
          className="flex-1"
        />
      </div>
    </>
  );
}
