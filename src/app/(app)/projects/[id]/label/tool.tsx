"use client";

import { AuthUser, ProjectLabel, Task, TrainedModels } from "@/db/schema";
import { LabelFilters } from "./filters";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { TaskList } from "./tasklist";

interface IToolProps {
  projectId: string;
  users: AuthUser[];
  trainedModels: TrainedModels[];
  projectLabels: ProjectLabel[];
  labelValues: string[];
}

export function Tool(props: IToolProps) {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  async function handleApplyClick() {
    const newSearchParams = new URLSearchParams(searchParams);
    const res = await fetch(
      `/api/projects/${props.projectId}/tasks/label?${newSearchParams.toString()}`
    );
    const newTasks = await res.json();
    setTasks(newTasks);
  }
  async function getNextTasks() {
    const newSearchParams = new URLSearchParams(searchParams);
    console.log(`tasks.length: ${tasks.length}`);
    if (tasks.length > 0) {
      newSearchParams.set("after", tasks[tasks.length - 1].createdAt as any);
    }

    const res = await fetch(
      `/api/projects/${props.projectId}/tasks/label?${newSearchParams.toString()}`
    );

    let newTasks = await res.json();

    if (newTasks.length > 0 && newTasks[0].id === tasks[tasks.length - 1].id) {
      newTasks = newTasks.slice(1);
    }

    const previousTaskLength = tasks.length;
    setTasks([...tasks, ...newTasks]);
    setStartIndex(previousTaskLength);
  }

  return (
    <div>
      <LabelFilters
        users={props.users}
        trainedModels={props.trainedModels}
        projectLabels={props.projectLabels}
        labelValues={props.labelValues}
        onApplyClick={handleApplyClick}
      />

      <TaskList
        tasks={tasks}
        projectLabels={props.projectLabels}
        startIndex={startIndex}
        fetchMoreTasks={() => getNextTasks()}
      />
    </div>
  );
}
