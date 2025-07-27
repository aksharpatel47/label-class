"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import useSwr from "swr";
import { UserDropdown } from "./filters";
import { ProjectLabel, Task, TaskLabelValue } from "@/db/schema";
import { LabelTask } from "./tasktool";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useEffect } from "react";
import { fetcher } from "@/app/lib/utils/fetcher";

type State = {
  index: number;
};

type Actions = {
  setIndex(index: number): void;
  nextImage(): void;
  prevImage(): void;
};

const useImageTableStore = create<State & Actions>()(
  immer((set) => ({
    index: 0,
    setIndex: (index) => {
      set((state) => {
        state.index = index;
      });
    },
    nextImage: () => {
      set((state) => {
        state.index = Math.min(state.index + 1, 49);
      });
    },
    prevImage: () => {
      set((state) => {
        state.index = Math.max(0, state.index - 1);
      });
    },
  }))
);

export function ImageTable(props: {
  projectId: string;
  projectLabels: ProjectLabel[];
}) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.set("page", page.toString());

  const url = `/api/projects/${
    props.projectId
  }/tasks?${urlSearchParams.toString()}`;

  const { index, setIndex, nextImage, prevImage } = useImageTableStore();
  const { data, error, isLoading } = useSwr<Array<Task>>(url, fetcher);

  function handleKeyDown(e: KeyboardEvent) {
    console.log(`Handling keydown ${e.key} in ImageTable`);
    if (e.key === "ArrowDown") {
      console.log("Next image");
      nextImage();
    } else if (e.key === "ArrowUp") {
      console.log("Previous image");
      prevImage();
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  if (!data || isLoading) {
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

  if (index >= data.length) {
    setIndex(data.length - 1);
  }

  console.log(`The current index is ${index}`);
  console.log(`The current task is ${JSON.stringify(data[index])}`);

  return (
    <>
      {/* <UserDropdown users={props.users} /> */}
      <div className="flex gap-8">
        <div className="mt-8 w-[300px] h-[800px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((task: Task, i: number) => (
                <TableRow key={task.id} onClick={() => setIndex(i)}>
                  <TableCell>{task.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <LabelTask
          task={data[index]}
          projectLabels={props.projectLabels}
          className="flex-1"
        />
      </div>
    </>
  );
}
