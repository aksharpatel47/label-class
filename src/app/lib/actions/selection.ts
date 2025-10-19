"use server";

import { ImageInferenceTypes } from "@/app/lib/models/image";
import { splitDataset } from "@/app/lib/utils/dataset";
import { db, sql } from "@/db";
import {
  datasetEnum,
  datasetEnumValues,
  ProjectTaskSelectionInsert,
  projectTaskSelections,
  Task,
  taskLabels,
  tasks,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { z } from "zod";

const selectionSchema = z.object({
  numImages: z.coerce.number(),
  labelId: z.string(),
  inferenceModelId: z.coerce.number(),
  imageInferenceType: z.enum(ImageInferenceTypes),
  dataset: z.enum([...datasetEnum.enumValues, "split"]),
});

interface IState {
  taskData?: {
    totalAvailableImages: number;
    tasks: Task[];
    labelId: string;
    imageInferenceType: (typeof ImageInferenceTypes)[number];
    dataset: (typeof datasetEnumValues)[number] | "split";
    inferenceModelId: number;
  };
  error?: string;
}

async function fetchTasksForTruePositiveImages(
  projectId: string,
  inferenceModelId: number,
  labelId: string
): Promise<Task[]> {
  // language=PostgreSQL
  return sql<Task[]>`
    select t.id, t.image_url as "imageUrl", t.name
    from tasks t
           inner join task_inferences ti on t.name = ti.image_name
           inner join task_labels tl on t.id = tl.task_id
           left join project_task_selections pts on t.id = pts.task_id and pts.label_id = tl.label_id
    where ti.model_id = ${inferenceModelId}
      and ti.inference >= 5000
      and tl.label_id = ${labelId}
      and tl.label_value = 'Present'
      and t.project_id = ${projectId}
      and pts.dataset is null
    order by ti.inference
  `;
}

async function fetchTasksForFalsePositiveImages(
  projectId: string,
  inferenceModelId: number,
  labelId: string
): Promise<Task[]> {
  // language=PostgreSQL
  return sql<Task[]>`
      select t.id, t.image_url as "imageUrl", t.name
      from tasks t
               inner join task_inferences ti on t.name = ti.image_name
               inner join task_labels tl on t.id = tl.task_id
               left join project_task_selections pts on t.id = pts.task_id and pts.label_id = tl.label_id
      where ti.model_id = ${inferenceModelId}
        and ti.inference >= 5000
        and tl.label_id = ${labelId}
        and tl.label_value = 'Absent'
        and t.project_id = ${projectId}
        and pts.dataset is null
      order by ti.inference desc
  `;
}

async function fetchTasksForFalseNegativeImages(
  projectId: string,
  inferenceModelId: number,
  labelId: string
): Promise<Task[]> {
  // language=PostgreSQL
  return sql<Task[]>`
      select t.id, t.image_url as "imageUrl", t.name
      from tasks t
               inner join task_inferences ti on t.name = ti.image_name
               inner join task_labels tl on t.id = tl.task_id
               left join project_task_selections pts on t.id = pts.task_id and pts.label_id = tl.label_id
      where ti.model_id = ${inferenceModelId}
        and ti.inference < 5000
        and tl.label_id = ${labelId}
        and tl.label_value = 'Present'
        and t.project_id = ${projectId}
        and pts.dataset is null
  `;
}

async function fetchTasksForTrueNegativeImages(
  projectId: string,
  inferenceModelId: number,
  labelId: string
): Promise<Task[]> {
  // language=PostgreSQL
  return sql<Task[]>`
      select t.id, t.image_url as "imageUrl", t.name
      from tasks t
               inner join task_inferences ti on t.name = ti.image_name
               inner join task_labels tl on t.id = tl.task_id
               left join project_task_selections pts on t.id = pts.task_id and pts.label_id = tl.label_id
      where ti.model_id = ${inferenceModelId}
        and ti.inference < 5000
        and tl.label_id = ${labelId}
        and tl.label_value = 'Absent'
        and t.project_id = ${projectId}
        and pts.dataset is null
      order by ti.inference desc
  `;
}

export async function selectionAction(
  projectId: string,
  prevState: IState | undefined,
  formData: FormData
): Promise<IState> {
  const result = selectionSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: "Invalid selection data" };
  }

  const { numImages, labelId, inferenceModelId } = result.data;

  let tasks: Task[] = [];

  const { imageInferenceType } = result.data;

  if (imageInferenceType === "True Positive") {
    tasks = await fetchTasksForTruePositiveImages(
      projectId,
      inferenceModelId,
      labelId
    );
  } else if (imageInferenceType === "False Positive") {
    tasks = await fetchTasksForFalsePositiveImages(
      projectId,
      inferenceModelId,
      labelId
    );
  } else if (imageInferenceType === "False Negative") {
    tasks = await fetchTasksForFalseNegativeImages(
      projectId,
      inferenceModelId,
      labelId
    );
  } else if (imageInferenceType === "True Negative") {
    tasks = await fetchTasksForTrueNegativeImages(
      projectId,
      inferenceModelId,
      labelId
    );
  }

  const totalAvailableImages = tasks.length;
  const selectedTasks = tasks.slice(0, numImages);

  return {
    taskData: {
      totalAvailableImages,
      tasks: selectedTasks,
      labelId,
      imageInferenceType,
      dataset: result.data.dataset,
      inferenceModelId,
    },
  };
}

interface IAddImagesState {
  error?: string;
  done?: boolean;
}

export async function addImagesToDataset(
  selectedTasks: Task[],
  labelId: string,
  imageInferenceType: (typeof ImageInferenceTypes)[number],
  projectId: string,
  dataset: (typeof datasetEnumValues)[number] | "split",
  prevState: IAddImagesState | undefined,
  formData: FormData
): Promise<IAddImagesState> {
  const taskIds = selectedTasks.map((image) => image.id);

  const labelValue =
    imageInferenceType === "True Positive" ||
    imageInferenceType === "False Negative"
      ? "Present"
      : "Absent";

  const filteredTasks = await db
    .select({
      id: tasks.id,
    })
    .from(tasks)
    .innerJoin(taskLabels, eq(tasks.id, taskLabels.taskId))
    .where(
      and(
        eq(taskLabels.labelId, labelId),
        eq(taskLabels.value, labelValue),
        inArray(tasks.id, taskIds)
      )
    );

  const filteredTaskIds = filteredTasks.map((task) => task.id);

  const datasets: any =
    dataset === "split"
      ? splitDataset(filteredTaskIds)
      : { [dataset]: filteredTaskIds };

  let projectTaskSelectionInserts: ProjectTaskSelectionInsert[] = [];

  for (const dataset in datasets) {
    for (const taskId of datasets[dataset]) {
      projectTaskSelectionInserts.push({
        taskId,
        labelId,
        dataset: dataset as any,
      });
    }
  }

  try {
    await db.insert(projectTaskSelections).values(projectTaskSelectionInserts);
  } catch (e) {
    return { error: "Failed to add images to dataset" };
  }

  revalidatePath(`/projects/${projectId}/selection`, "page");
  redirect(`/projects/${projectId}/statistics/dataset`, RedirectType.push);
}
