"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProjectLabel, Task, TaskLabelValue } from "@/db/schema";
import type { fetchTasksForLabeling } from "@/lib/data/tasks";
import { Label } from "@radix-ui/react-label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import clsx from "clsx";
import { Terminal } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const taskLabelValues = [undefined, "Present", "Absent", "Difficult", "Skip"];

type TaskLabels = Record<string, string | undefined>;

type State = {
  loadingLabels: boolean;
  savingLabels: boolean;
  taskLabels: TaskLabels;
};

type Actions = {
  next(
    totalTaskLength: number,
    currentTaskId: string,
    currentTaskLabels: TaskLabels
  ): Promise<void>;
  setLoadingLabels(loading: boolean): void;
  setSavingLabels(saving: boolean): void;
  setLabels(taskLabels: TaskLabels): void;
  cycleLabelValue(currentTaskId: string, labelId: string): void;
  setLabelValue(labelId: string, value: string | undefined): void;
};

const useTaskToolStore = create<State & Actions>()(
  immer((set) => ({
    index: 0,
    loadingLabels: false,
    savingLabels: false,
    taskLabels: {},
    async next(
      totalTaskLength: number,
      currentTaskId: string,
      currentTaskLabels: TaskLabels
    ) {
      console.log(
        `Saving labels for task ${currentTaskId} with labels ${JSON.stringify(
          currentTaskLabels
        )}`
      );
      const results = await Promise.allSettled(
        Object.entries(currentTaskLabels).map(async ([labelId, labelValue]) => {
          const method = labelValue === undefined ? "DELETE" : "POST";
          const res = await fetch(
            `/api/tasks/${currentTaskId}/labels/${labelId}`,
            {
              method,
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ value: labelValue }),
            }
          );
          console.log(await res.json());
        })
      );

      console.log(`Results: ${JSON.stringify(results)}`);

      set((state) => {
        state.loadingLabels = false;
        state.savingLabels = false;
        state.taskLabels = {};
      });
    },
    async prev(currentTaskId: string, currentTaskLabels: TaskLabels) {
      console.log(
        `Saving labels for task ${currentTaskId} with labels ${JSON.stringify(
          currentTaskLabels
        )}`
      );
      const results = await Promise.allSettled(
        Object.entries(currentTaskLabels).map(async ([labelId, labelValue]) => {
          const method =
            labelValue === undefined || labelValue === "" ? "DELETE" : "POST";
          const res = await fetch(
            `/api/tasks/${currentTaskId}/labels/${labelId}`,
            {
              method,
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ value: labelValue }),
            }
          );
          console.log(await res.json());
        })
      );

      console.log(`Results: ${JSON.stringify(results)}`);
      set((state) => {
        state.loadingLabels = false;
        state.savingLabels = false;
        state.taskLabels = {};
      });
    },
    setLabels(taskLabels: TaskLabels) {
      set((state) => {
        state.taskLabels = taskLabels;
      });
    },
    cycleLabelValue(currentTaskId: string, labelId: string) {
      set((state) => {
        const currentLabelValue = state.taskLabels[labelId];
        const currentLabelIndex = taskLabelValues.indexOf(currentLabelValue);
        const newLabelIndex = (currentLabelIndex + 1) % taskLabelValues.length;
        console.log(
          `Updating label ${labelId} to ${newLabelIndex} (${taskLabelValues[newLabelIndex]})`
        );
        const newLabelValue = taskLabelValues[newLabelIndex];
        state.taskLabels[labelId] = newLabelValue;
        const method =
          newLabelValue === undefined || newLabelValue === ""
            ? "DELETE"
            : "POST";
        fetch(`/api/tasks/${currentTaskId}/labels/${labelId}`, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value: newLabelValue }),
        })
          .then((res) => res.json())
          .then(console.log);
      });
    },
    setLoadingLabels(loading: boolean) {
      set((state) => {
        state.loadingLabels = loading;
      });
    },
    setSavingLabels(saving: boolean) {
      set((state) => {
        state.savingLabels = saving;
      });
    },
    setLabelValue(labelId: string, value: string | undefined) {
      set((state) => {
        state.taskLabels[labelId] = value;
      });
    },
  }))
);

export function TaskTool({
  projectId,
  task,
  labels: projectLabels,
  className,
}: {
  projectId: string;
  task: Task;
  labels: ProjectLabel[];
  labelValues: TaskLabelValue;
  className?: string;
}) {
  const projectLabelKeys = projectLabels.reduce(
    (acc, d, i) => ({
      ...acc,
      [`${i + 1}`]: d.id,
    }),
    {}
  );

  const {
    taskLabels,
    setLabels,
    cycleLabelValue,
    setLoadingLabels,
    setLabelValue,
  } = useTaskToolStore();

  function handleKeyDown(e: KeyboardEvent) {
    if (projectLabelKeys.hasOwnProperty(Number(e.key))) {
      cycleLabelValue(task.id, projectLabels[Number(e.key) - 1].id);
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [task.id]);

  useEffect(() => {
    setLoadingLabels(true);
    fetch(`/api/projects/${projectId}/tasks/${task.id}/labels`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setLabels(
          data.reduce(
            (acc: any, v: any) => ({ ...acc, [v.labelId]: v.value }),
            {}
          )
        );
        setLoadingLabels(false);
      });
  }, [task.id]);

  return (
    <div className={className}>
      <div className="flex">
        <Image
          src={task.imageUrl}
          alt={task.id}
          height={600}
          width={600}
          className="flex-1"
        />
        <div className="flex flex-col flex-1 pl-8 gap-4">
          {projectLabels.map((l, i) => (
            <div key={task.id + "-" + l.id} className="flex items-center">
              <span className="w-[150px]">
                ( {i + 1} ) &nbsp;
                {l.labelName} &nbsp;
              </span>
              <ToggleGroup
                variant="outline"
                type="single"
                value={taskLabels[l.id]}
                onValueChange={(v) => setLabelValue(l.id, v)}
              >
                {taskLabelValues.slice(1).map((pl) => (
                  <ToggleGroupItem key={pl} value={pl!}>
                    {pl}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
