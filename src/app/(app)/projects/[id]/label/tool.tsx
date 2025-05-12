"use client";

import { AuthUser, ProjectLabel, Task, TrainedModel } from "@/db/schema";
import { LabelFilters } from "./filters";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { LabelTask } from "../tasktool";

interface IToolProps {
  projectId: string;
  users: AuthUser[];
  trainedModels: TrainedModel[];
  projectLabels: ProjectLabel[];
  labelValues: string[];
}

export function Tool(props: IToolProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();
  const projectLabel = searchParams.get("label") || "";
  const projectLabelValue = searchParams.get("labelvalue") || "";
  const user = searchParams.get("user") || "";
  const trainedModel = searchParams.get("trainedmodel") || "";
  const inferenceValue = searchParams.get("inferencevalue") || "";
  const dataset = searchParams.get("dataset") || "";
  const currentValues = {
    label: projectLabel,
    labelvalue: projectLabelValue,
    user,
    trainedmodel: trainedModel,
    inferencevalue: inferenceValue,
    dataset,
  };
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [index, setIndex] = useState(0);
  const [loadingTasks, setLoadingTasks] = useState(false);

  /**
   * This function is called when the user clicks on the apply button of the filters
   */
  async function handleApplyClick() {
    setLoadingTasks(true);
    const res = await fetch(
      `/api/projects/${props.projectId}/tasks/label?${searchParams.toString()}`
    );
    const newTasks = await res.json();
    setIndex(0);
    setTasks(newTasks);
    setLoadingTasks(false);
  }

  /**
   * handleSelectChange is called when the user changes the value of any of the filters.
   * @param newValues Object containing the new values of the filters.
   */
  function handleSelectChange(newValues: {
    [key: string]: string | undefined;
  }) {
    const urlSearchParams = new URLSearchParams(searchParams);

    if (urlSearchParams.get("after")) {
      urlSearchParams.delete("after");
    }

    for (const [key, value] of Object.entries(newValues)) {
      if (!value) {
        urlSearchParams.delete(key);
        continue;
      }
      urlSearchParams.set(key, value);
    }
    router.replace(`${pathName}?${urlSearchParams.toString()}`);
  }

  /**
   * This function is called when the user reaches the end of the task list.
   */
  async function getNextTasks() {
    setLoadingTasks(true);
    const newSearchParams = new URLSearchParams(searchParams);
    if (tasks !== null && tasks.length > 0) {
      newSearchParams.set("after", tasks[tasks.length - 1].id as any);
    }

    const res = await fetch(
      `/api/projects/${props.projectId}/tasks/label?${newSearchParams.toString()}`
    );

    let newTasks = await res.json();

    if (newTasks.length > 0 && tasks !== null) {
      // find the index of the first task that is already present in the tasks array
      const firstIndex = tasks.findIndex((task) => {
        return task.id === newTasks[0].id;
      });
      if (firstIndex !== -1) {
        const tasksToRemove = tasks.length - firstIndex;
        newTasks = newTasks.slice(tasksToRemove);
      }
    }

    const previousTasks = tasks ?? [];
    const previousTaskLength = previousTasks.length;
    setTasks([...previousTasks, ...newTasks]);
    setIndex(previousTaskLength);
    setLoadingTasks(false);
  }

  /**
   * handleArrowClick is called when the user presses any keys on the keyboard.
   * If the user presses the left arrow key, the index is decremented by 1.
   * If the user presses the right arrow key, the index is incremented by 1.
   * If the user presses the right arrow key and the index is equal to the length of the tasks array,
   * the getNextTasks function is called.
   * @param e KeyboardEvent
   * @returns Promise<void>
   */
  async function handleArrowClick(e: KeyboardEvent) {
    if (tasks === null) {
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const after = searchParams.get("after");
      if (index < tasks.length && after !== (tasks[index].createdAt as any)) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("after", tasks[index].id.toString() as any);
        router.replace(`${pathName}?${newSearchParams.toString()}`);
      }
    }
    if (e.key === "ArrowLeft") {
      setIndex(Math.max(0, index - 1));
    } else if (e.key === "ArrowRight") {
      if (index === tasks.length - 1) {
        await getNextTasks();
      } else {
        setIndex(Math.min(index + 1, tasks.length));
      }
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleArrowClick);

    return () => {
      document.removeEventListener("keydown", handleArrowClick);
    };
  });

  let labelTaskComponent: ReactNode | null = null;

  if (loadingTasks) {
    labelTaskComponent = (
      <div className="p-2">Loading images. Please wait...</div>
    );
  } else if (tasks === null) {
    labelTaskComponent = (
      <div className="p-2">
        Please select the filters and click on apply to see images.
      </div>
    );
  } else if (index === tasks.length) {
    labelTaskComponent = (
      <div className="p-2">
        No more images to label for this set of filters. Please change the
        filters and click on apply to see more images.
      </div>
    );
  } else {
    labelTaskComponent = (
      <div>
        <div className="p-2">
          Use the arrow keys to navigate between images. Currently on{" "}
          {index + 1} of {tasks.length}. Current task bookmark:{" "}
          {tasks[index].createdAt as any}
        </div>
        <LabelTask
          task={tasks[index]}
          nextTask={index < tasks.length - 1 ? tasks[index + 1] : undefined}
          projectLabels={props.projectLabels}
          selectedModelId={parseInt(trainedModel)}
        />
      </div>
    );
  }

  return (
    <div>
      <LabelFilters
        users={props.users}
        trainedModels={props.trainedModels}
        projectLabels={props.projectLabels}
        labelValues={props.labelValues}
        currentValues={currentValues}
        inferenceValues={[
          "0-9.99%",
          "10.00-19.99%",
          "20.00-29.99%",
          "30.00-39.99%",
          "40.00-49.99%",
          "50.00-59.99%",
          "60.00-69.99%",
          "70.00-79.99%",
          "80.00-89.99%",
          "90.00-100.00%",
          ">=50%",
          "<50%",
        ]}
        onSelectChange={handleSelectChange}
        onApplyClick={handleApplyClick}
      />

      {labelTaskComponent}
    </div>
  );
}
