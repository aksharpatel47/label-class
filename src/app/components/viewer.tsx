"use client";

import { LabelTask } from "@/app/components/tasktool";
import { Task } from "@/db/schema";
import { fetchProjectsWithIds } from "@/lib/data/projects";
import { useEffect, useState } from "react";

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

  if (tasks.length === 0) {
    return <div className="p-2">No tasks available to display.</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <span>Total: {tasks.length}</span>
        <input
          type="number"
          min="1"
          max={tasks.length}
          value={index + 1}
          onChange={(e) => {
            const newIndex = parseInt(e.target.value) - 1;
            if (!isNaN(newIndex) && newIndex >= 0 && newIndex < tasks.length) {
              setIndex(newIndex);
            }
          }}
          className="w-20 px-2 py-1 border rounded"
        />
      </div>
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
    </div>
  );
}
