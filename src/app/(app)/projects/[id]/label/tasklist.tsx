import { ProjectLabel, Task } from "@/db/schema";
import { useEffect, useState } from "react";
import { LabelTask } from "../tasktool";

interface ITaskList {
  tasks: Task[];
  projectLabels: ProjectLabel[];
}
export function TaskList(props: ITaskList) {
  const [index, setIndex] = useState(0);

  function handleArrowClick(e: KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      setIndex(Math.max(0, index - 1));
    } else if (e.key === "ArrowRight") {
      setIndex(Math.min(index + 1, props.tasks.length - 1));
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleArrowClick);

    return () => {
      document.removeEventListener("keydown", handleArrowClick);
    };
  });

  if (props.tasks.length === 0) {
    return (
      <div className="p-2">
        Select the filter above and click on apply to see the images to label.
      </div>
    );
  }

  return (
    <div>
      <div className="p-2">
        Use the arrow keys to navigate between images. Once you reach the end,
        click on apply again to get a new set of images
      </div>
      <LabelTask
        task={props.tasks[index]}
        projectLabels={props.projectLabels}
      />
    </div>
  );
}
