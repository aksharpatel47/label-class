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

  async function handleApplyClick() {
    const res = await fetch(
      `/api/projects/${props.projectId}/tasks/label?${searchParams.toString()}`
    );
    const tasks = await res.json();
    console.log(tasks);
    setTasks(tasks);
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

      <TaskList tasks={tasks} projectLabels={props.projectLabels} />
    </div>
  );
}
