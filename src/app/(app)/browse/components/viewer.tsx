"use client";

import { Task } from "@/db/schema";
import { LabelTask } from "../../projects/[id]/tasktool";
import { fetchProjectsWithIds } from "@/lib/data/projects";
import { useState, useEffect } from "react";

interface DatasetViewerProps {
  tasks: Task[];
  projectsWithLabels: Awaited<ReturnType<typeof fetchProjectsWithIds>>;
  selectedModelId?: number;
}

export function DatasetViewer({
  tasks,
  projectsWithLabels,
  selectedModelId,
}: DatasetViewerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setIndex((prevIndex) => Math.max(0, prevIndex - 1));
      } else if (event.key === "ArrowRight") {
        setIndex((prevIndex) => Math.min(tasks.length - 1, prevIndex + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [tasks.length]);

  return (
    <LabelTask
      task={tasks[index]}
      nextTask={index + 1 < tasks.length ? tasks[index + 1] : undefined}
      projectLabels={
        projectsWithLabels.find((p) => p.id === tasks[index].projectId)
          ?.projectLabels || []
      }
      selectedModelId={selectedModelId}
      disableKeyboardShortcuts={true}
    />
  );
}
