import { LabelTask } from "@/app/components/tasktool";
import { Button } from "@/components/ui/button";
import { ProjectLabel, Task } from "@/db/schema";
import { useEffect, useState } from "react";

export interface IReviewImagesProps {
  tasks: Task[];
  projectLabels: ProjectLabel[];
  selectedModelId?: number;
  addImagesToDatasetAction: any;
}
export function ReviewImages({
  tasks,
  projectLabels,
  selectedModelId,
  addImagesToDatasetAction,
}: IReviewImagesProps) {
  const [index, setIndex] = useState(0);

  function handleArrowClick(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      if (index < tasks.length) {
        setIndex(index + 1);
      }
    } else if (e.key === "ArrowLeft") {
      if (index > 0) {
        setIndex(index - 1);
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleArrowClick);
    return () => {
      window.removeEventListener("keydown", handleArrowClick);
    };
  });

  return (
    <div>
      <form action={addImagesToDatasetAction}>
        <div className="flex gap-4">
          <Button type="submit">Add Images to Dataset</Button>
          <Button
            type="button"
            onClick={() => {
              if (index > 0) {
                setIndex(index - 1);
              }
            }}
            disabled={index === 0}
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (index < tasks.length) {
                setIndex(index + 1);
              }
            }}
            disabled={index === tasks.length}
          >
            Next
          </Button>
        </div>
      </form>
      <div className="flex flex-col gap-4"></div>
      {tasks.length === 0 ? (
        <div>No tasks yet.</div>
      ) : index >= tasks.length ? (
        <div>No more tasks to review.</div>
      ) : (
        <LabelTask
          task={tasks[index]}
          nextTask={index < tasks.length - 1 ? tasks[index + 1] : undefined}
          projectLabels={projectLabels}
          disableKeyboardShortcuts={true}
          selectedModelId={selectedModelId}
        />
      )}
    </div>
  );
}
