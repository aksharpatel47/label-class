"use client";

import { ProjectLabel, Task, TaskLabel } from "@/db/schema";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Image from "next/image";
import { useEffect } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const taskLabelValues = [undefined, "Present", "Absent", "Difficult", "Skip"];

type TaskLabels = Record<string, string | undefined>;

type State = {
  loadingInitialLabels: boolean;
  savingLabels: boolean;
  taskLabels: TaskLabels;
};

type Actions = {
  setInitialLabels(taskLabels: TaskLabels): void;
  setLoadingInitialLabels(loading: boolean): void;
  cycleLabelValue(currentTaskId: string, labelId: string): void;
  setLabelValue(
    currentaskId: string,
    labelId: string,
    value: string | undefined
  ): void;
};

const useLabelTaskStore = create<State & Actions>()(
  immer((set) => ({
    index: 0,
    loadingInitialLabels: false,
    savingLabels: false,
    taskLabels: {},
    setLoadingInitialLabels(loading) {
      set((state) => {
        state.loadingInitialLabels = loading;
      });
    },
    setInitialLabels(taskLabels: TaskLabels) {
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
    setLabelValue(
      currentTaskId: string,
      labelId: string,
      value: string | undefined
    ) {
      set((state) => {
        state.taskLabels[labelId] = value;

        const method = "POST";
        fetch(`/api/tasks/${currentTaskId}/labels/${labelId}`, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value }),
        })
          .then((res) => res.json())
          .then(console.log);
      });
    },
  }))
);

export function LabelTask({
  task,
  projectLabels,
  className,
}: {
  task: Task;
  projectLabels: ProjectLabel[];
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
    loadingInitialLabels,
    setLoadingInitialLabels,
    setInitialLabels,
    cycleLabelValue,
    setLabelValue,
  } = useLabelTaskStore();

  useEffect(() => {
    setLoadingInitialLabels(true);
    const labelUrl = `/api/tasks/${task.id}/labels`;

    fetch(labelUrl)
      .then((resp) => resp.json())
      .then((data) => {
        const taskLabels: TaskLabels = {};
        data.forEach((l: TaskLabel) => {
          taskLabels[l.labelId] = l.value;
        });
        setInitialLabels(taskLabels);
        setLoadingInitialLabels(false);
      });
  }, [task.id]);

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

  return (
    <div className={className}>
      <div className="flex h-svh">
        <div className="h-full">
          <Image
            src={task.imageUrl}
            alt={task.id}
            width={640}
            height={640}
            className="flex-1"
          />
        </div>

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
                onValueChange={(v) => setLabelValue(task.id, l.id, v)}
                disabled={loadingInitialLabels}
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
