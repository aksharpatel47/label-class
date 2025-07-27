import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { H4 } from "@/components/ui/typography";
import { db } from "@/db";
import {
  Dataset,
  projectLabels,
  projects,
  projectTaskSelections,
  taskInferences,
  taskLabels,
  TaskLabelValue,
  tasks,
} from "@/db/schema";
import { fetchProjectsWithIds } from "@/lib/data/projects";
import { and, eq, getTableColumns, gte, inArray, lt, sql } from "drizzle-orm";
import { DatasetViewer } from "./components/viewer";

export default async function Page({
  searchParams,
}: {
  searchParams: {
    label: string;
    labelValue: TaskLabelValue;
    dataset: Dataset;
    selectedProjects: string[];
    trainedModelId?: string;
    inferenceValue?: string;
  };
}) {
  const projectLabelsResult = await fetchProjectsWithIds(
    searchParams.selectedProjects
  );

  let query = db
    .select({
      ...getTableColumns(tasks),
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(
      projectLabels,
      and(
        eq(projects.id, projectLabels.projectId),
        eq(projectLabels.labelName, searchParams.label)
      )
    )
    .innerJoin(
      taskLabels,
      and(
        eq(tasks.id, taskLabels.taskId),
        eq(taskLabels.labelId, projectLabels.id),
        eq(taskLabels.value, searchParams.labelValue)
      )
    )
    .innerJoin(
      projectTaskSelections,
      and(
        eq(tasks.id, projectTaskSelections.taskId),
        eq(projectTaskSelections.labelId, projectLabels.id),
        eq(projectTaskSelections.dataset, searchParams.dataset)
      )
    )
    .$dynamic();

  const whereConditions = [
    inArray(tasks.projectId, searchParams.selectedProjects),
  ];

  if (searchParams.trainedModelId && searchParams.inferenceValue) {
    query = query
      .innerJoin(
        taskInferences,
        and(
          eq(taskInferences.imageName, tasks.name),
          eq(taskInferences.modelId, parseInt(searchParams.trainedModelId))
        )
      )
      .$dynamic();

    let inferenceCondition = gte(taskInferences.inference, 5000);

    if (searchParams.inferenceValue === "<50%") {
      inferenceCondition = lt(taskInferences.inference, 5000);
    }

    whereConditions.push(inferenceCondition);
  }

  const results = await query
    .where(and(...whereConditions))
    .groupBy(...Object.values(getTableColumns(tasks)))
    .orderBy(tasks.name);

  return (
    <div>
      <div className="flex flex-row gap-4">
        <div className="flex flex-col">
          <H4>Label</H4>
          {searchParams.label}
        </div>
        <div>
          <H4>Label Value</H4>
          {searchParams.labelValue}
        </div>
        <div>
          <H4>Dataset</H4>
          {searchParams.dataset}
        </div>
        <div>
          <H4>Selected Projects</H4>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Projects" />
            </SelectTrigger>
            <SelectContent>
              {projectLabelsResult.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <H4>Trained Model ID</H4>
          {searchParams.trainedModelId}
        </div>
        <div>
          <H4>Inference Value</H4>
          {searchParams.inferenceValue}
        </div>
        <div>Found {results.length} results</div>
      </div>
      <DatasetViewer
        tasks={results}
        projectsWithLabels={projectLabelsResult}
        selectedModelId={
          searchParams.trainedModelId
            ? parseInt(searchParams.trainedModelId)
            : undefined
        }
      />
    </div>
  );
}
