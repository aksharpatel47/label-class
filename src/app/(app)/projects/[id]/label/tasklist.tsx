import { ProjectLabel, Task } from "@/db/schema";
import { useEffect, useState } from "react";
import { LabelTask } from "../tasktool";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface ITaskList {
  tasks: Task[];
  projectLabels: ProjectLabel[];
  startIndex: number;
  fetchMoreTasks: () => Promise<void>;
}
export function TaskList(props: ITaskList) {
  const [index, setIndex] = useState(props.startIndex);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  async function handleArrowClick(e: KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const after = searchParams.get("after");
      if (after !== (props.tasks[index].createdAt as any)) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("after", props.tasks[index].createdAt as any);
        router.replace(`${pathname}?${newSearchParams.toString()}`);
      }
    }
    if (e.key === "ArrowLeft") {
      setIndex(Math.max(0, index - 1));
    } else if (e.key === "ArrowRight") {
      setIndex(Math.min(index + 1, props.tasks.length));
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

  if (index === props.tasks.length && props.startIndex === props.tasks.length) {
    return (
      <div className="p-2">
        No more images to label for this set of filters. Please change the
        filters and click on apply to see more images.
      </div>
    );
  } else if (index >= props.tasks.length) {
    props.fetchMoreTasks();
    return <div className="p-2">Loading more images. Please wait...</div>;
  }

  return (
    <div>
      <div className="p-2">
        Use the arrow keys to navigate between images. Currently on {index + 1}{" "}
        of {props.tasks.length}. Current task bookmark:{" "}
        {props.tasks[index].createdAt as any}
      </div>
      <LabelTask
        task={props.tasks[index]}
        projectLabels={props.projectLabels}
      />
    </div>
  );
}
