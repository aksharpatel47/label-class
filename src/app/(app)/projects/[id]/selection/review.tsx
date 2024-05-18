import { ProjectLabel, Task } from "@/db/schema";
import { LabelTask } from "@/app/(app)/projects/[id]/tasktool";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addImagesToDataset } from "@/app/lib/actions/selection";

export interface IReviewImagesProps {
  tasks: Task[];
  projectLabels: ProjectLabel[];
}
export function ReviewImages({ tasks, projectLabels }: IReviewImagesProps) {
  const [index, setIndex] = useState(0);

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <Button
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
          />
        )}
      </div>
    </div>
  );
}
