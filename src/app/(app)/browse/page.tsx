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
  authUser,
  Dataset,
  projectLabels,
  projects,
  projectTaskSelections,
  taskInferences,
  taskLabelEnumValues,
  taskLabels,
  TaskLabelValue,
  tasks,
} from "@/db/schema";
import { fetchProjectsWithIds } from "@/lib/data/projects";
import { and, eq, getTableColumns, gte, inArray, lte } from "drizzle-orm";
import { DatasetViewer } from "../../components/viewer";

export default async function Page(props: {
  searchParams: Promise<{
    label: string;
    labelValue?: TaskLabelValue;
    dataset?: Dataset;
    selectedProjects: string[];
    labeledBy?: string;
    updatedBy?: string;
    flag?: "true";
    trainedModelId?: string;
    inferenceValue?: string;
    leftInferenceValue?: string;
    rightInferenceValue?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
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

    .$dynamic();

  const whereConditions = [
    inArray(tasks.projectId, searchParams.selectedProjects),
    eq(taskLabels.flag, flag),
  ];

  let labeledByName = "";

  if (searchParams.labeledBy) {
    whereConditions.push(eq(taskLabels.labeledBy, searchParams.labeledBy));
    const result = await db.query.authUser.findFirst({
      where: eq(authUser.id, searchParams.labeledBy),
    });
    labeledByName = result?.name || "";
  }

  let updatedByName = "";
  if (searchParams.updatedBy) {
    whereConditions.push(eq(taskLabels.labelUpdatedBy, searchParams.updatedBy));
    const result = await db.query.authUser.findFirst({
      where: eq(authUser.id, searchParams.updatedBy),
    });
    updatedByName = result?.name || "";
  }

  let datasetLabel = "Any Or None";

  if (searchParams.dataset) {
    query = query.innerJoin(
      projectTaskSelections,
      and(
        eq(tasks.id, projectTaskSelections.taskId),
        eq(projectTaskSelections.labelId, projectLabels.id),
        eq(projectTaskSelections.dataset, searchParams.dataset)
      )
    );
    datasetLabel = searchParams.dataset;
  }

  let labelValueLabel = taskLabelEnumValues.join(", ");

  if (searchParams.labelValue) {
    whereConditions.push(eq(taskLabels.value, searchParams.labelValue));
    labelValueLabel = searchParams.labelValue;
  } else {
    whereConditions.push(inArray(taskLabels.value, taskLabelEnumValues));
  }

  let inferenceThresholdLabel = "";

  if (searchParams.trainedModelId) {
    const leftParam = searchParams.leftInferenceValue;
    const rightParam = searchParams.rightInferenceValue;
    const legacyInferenceValue = searchParams.inferenceValue;

    let leftThreshold: number | null = null;
    let rightThreshold: number | null = null;

    if (leftParam && rightParam) {
      leftThreshold = Number(leftParam);
      rightThreshold = Number(rightParam);
    } else if (legacyInferenceValue) {
      const [legacyLeft, legacyRight] = legacyInferenceValue
        .split("-")
        .map(Number);
      leftThreshold = legacyLeft ?? null;
      rightThreshold = legacyRight ?? null;
    }

    if (
      leftThreshold !== null &&
      rightThreshold !== null &&
      !Number.isNaN(leftThreshold) &&
      !Number.isNaN(rightThreshold)
    ) {
      query = query
        .innerJoin(
          taskInferences,
          and(
            eq(taskInferences.imageName, tasks.name),
            eq(taskInferences.modelId, parseInt(searchParams.trainedModelId))
          )
        )
        .$dynamic();

      whereConditions.push(
        and(
          gte(taskInferences.inference, leftThreshold),
          lte(taskInferences.inference, rightThreshold)
        )!
      );

      inferenceThresholdLabel = `${(leftThreshold / 100).toFixed(2)}% - ${(rightThreshold / 100).toFixed(2)}%`;
    }
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
            {labeledByName}
          </div>
        )}
        {searchParams.updatedBy && (
          <div>
            <H4>Updated By</H4>
            {updatedByName}
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
        {inferenceThresholdLabel && (
          <div>
            <H4>Inference Threshold</H4>
            {inferenceThresholdLabel}
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
