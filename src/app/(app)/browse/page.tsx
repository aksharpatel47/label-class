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
  datasetEnumValues,
  projectLabels,
  projects,
  projectTaskSelections,
  taskInferences,
  taskLabelEnumValues,
  taskLabels,
  taskLabelValue,
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
    labelValue?: TaskLabelValue;
    dataset?: Dataset;
    selectedProjects: string[];
    labeledBy?: string;
    updatedBy?: string;
    flag?: "true";
    trainedModelId?: string;
    inferenceValue?: string;
  };
}) {
  const projectLabelsResult = await fetchProjectsWithIds(
    searchParams.selectedProjects
  );

  const flag = searchParams.flag === "true";

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
        eq(taskLabels.labelId, projectLabels.id)
      )
    )
    .innerJoin(
      projectTaskSelections,
      and(
        eq(tasks.id, projectTaskSelections.taskId),
        eq(projectTaskSelections.labelId, projectLabels.id)
      )
    )
    .$dynamic();

  const whereConditions = [
    inArray(tasks.projectId, searchParams.selectedProjects),
    eq(taskLabels.flag, flag),
  ];

  if (searchParams.labeledBy) {
    whereConditions.push(eq(taskLabels.labeledBy, searchParams.labeledBy));
  }

  if (searchParams.updatedBy) {
    whereConditions.push(eq(taskLabels.labelUpdatedBy, searchParams.updatedBy));
  }

  let datasetLabel = datasetEnumValues.join(", ");

  if (searchParams.dataset) {
    whereConditions.push(
      eq(projectTaskSelections.dataset, searchParams.dataset)
    );
    datasetLabel = searchParams.dataset;
  } else {
    whereConditions.push(
      inArray(projectTaskSelections.dataset, datasetEnumValues)
    );
  }

  let labelValueLabel = taskLabelEnumValues.join(", ");

  if (searchParams.labelValue) {
    whereConditions.push(eq(taskLabels.value, searchParams.labelValue));
    labelValueLabel = searchParams.labelValue;
  } else {
    whereConditions.push(inArray(taskLabels.value, taskLabelEnumValues));
  }

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
          {labelValueLabel}
        </div>
        <div>
          <H4>Dataset</H4>
          {datasetLabel}
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
        {searchParams.labeledBy && (
          <div>
            <H4>Labeled By</H4>
            {searchParams.labeledBy}
          </div>
        )}
        {searchParams.updatedBy && (
          <div>
            <H4>Updated By</H4>
            {searchParams.updatedBy}
          </div>
        )}
        {searchParams.flag && (
          <div>
            <H4>Flagged</H4>
            {searchParams.flag}
          </div>
        )}
        {searchParams.trainedModelId && (
          <div>
            <H4>Trained Model ID</H4>
            {searchParams.trainedModelId}
          </div>
        )}
        {searchParams.inferenceValue && (
          <div>
            <H4>Inference Value</H4>
            {searchParams.inferenceValue}
          </div>
        )}
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
