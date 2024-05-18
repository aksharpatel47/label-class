"use server";

import { z } from "zod";
import { db, sql } from "@/db";
import { ImageInferenceTypes } from "@/app/lib/models/image";
import {
  ProjectTaskSelectionInsert,
  projectTaskSelections,
  Task,
  taskLabels,
  tasks,
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { redirect, RedirectType } from "next/navigation";

const selectionSchema = z.object({
  numImages: z.coerce.number(),
  labelId: z.string(),
  inferenceModelId: z.coerce.number(),
  imageInferenceType: z.enum(ImageInferenceTypes),
});

interface IState {
  taskData?: {
    totalAvailableImages: number;
    tasks: Task[];
    labelId: string;
    imageInferenceType: (typeof ImageInferenceTypes)[number];
  };
  error?: string;
}

/**
 * @param array
 * @returns
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * @param array
 * @param count
 * @returns
 */
function selectAndShuffle<T>(array: T[], count: number): T[] {
  return shuffle(array).slice(0, count);
}

async function fetchTasksForTruePositiveImages(
  projectId: string,
  inferenceModelId: number,
  labelId: string,
): Promise<Task[]> {
  // language=PostgreSQL
  return sql<Task[]>`
    select t.id, t.image_url as "imageUrl"
    from tasks t
           inner join task_inferences ti on t.id = ti.task_id
           inner join task_labels tl on t.id = tl.task_id
           left join project_task_selections pts on t.id = pts.task_id and pts.label_id = tl.label_id
    where ti.model_id = ${inferenceModelId}
      and ti.inference >= 50
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
  labelId: string,
): Promise<Task[]> {
  // language=PostgreSQL
  return sql<Task[]>`
      select t.id, t.image_url as "imageUrl"
      from tasks t
               inner join task_inferences ti on t.id = ti.task_id
               inner join task_labels tl on t.id = tl.task_id
               left join project_task_selections pts on t.id = pts.task_id and pts.label_id = tl.label_id
      where ti.model_id = ${inferenceModelId}
        and ti.inference >= 50
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
  labelId: string,
): Promise<Task[]> {
  // language=PostgreSQL
  return sql<Task[]>`
      select t.id, t.image_url as "imageUrl"
      from tasks t
               inner join task_inferences ti on t.id = ti.task_id
               inner join task_labels tl on t.id = tl.task_id
               left join project_task_selections pts on t.id = pts.task_id and pts.label_id = tl.label_id
      where ti.model_id = ${inferenceModelId}
        and ti.inference < 50
        and tl.label_id = ${labelId}
        and tl.label_value = 'Present'
        and t.project_id = ${projectId}
        and pts.dataset is null
  `;
}

async function fetchTasksForTrueNegativeImages(
  projectId: string,
  inferenceModelId: number,
  labelId: string,
): Promise<Task[]> {
  // language=PostgreSQL
  return sql<Task[]>`
      select t.id, t.image_url as "imageUrl"
      from tasks t
               inner join task_inferences ti on t.id = ti.task_id
               inner join task_labels tl on t.id = tl.task_id
               left join project_task_selections pts on t.id = pts.task_id and pts.label_id = tl.label_id
      where ti.model_id = ${inferenceModelId}
        and ti.inference < 50
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
  formData: FormData,
): Promise<IState> {
  const result = selectionSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: "Invalid selection data" };
  }

  const { numImages, labelId, inferenceModelId } = result.data;
  console.log(
    `numImages: ${numImages}, labelId: ${labelId}, inferenceModelId: ${inferenceModelId}`,
  );

  let tasks: Task[] = [];

  const { imageInferenceType } = result.data;

  if (imageInferenceType === "True Positive") {
    tasks = await fetchTasksForTruePositiveImages(
      projectId,
      inferenceModelId,
      labelId,
    );
  } else if (imageInferenceType === "False Positive") {
    tasks = await fetchTasksForFalsePositiveImages(
      projectId,
      inferenceModelId,
      labelId,
    );
  } else if (imageInferenceType === "False Negative") {
    tasks = await fetchTasksForFalseNegativeImages(
      projectId,
      inferenceModelId,
      labelId,
    );
  } else if (imageInferenceType === "True Negative") {
    tasks = await fetchTasksForTrueNegativeImages(
      projectId,
      inferenceModelId,
      labelId,
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
    },
  };
}

/**
 * @param {string[]} dataset
 * @returns {{train: string[], valid: string[], test: string[]}}
 */
function splitDataset(dataset: string[]) {
  dataset = shuffle(dataset);
  const datasetLength = dataset.length;
  const validTestImageCount = Math.ceil(datasetLength * 0.15);
  const trainImageCount = datasetLength - validTestImageCount * 2;

  const trainImages = dataset.slice(0, trainImageCount);
  const validImages = dataset.slice(
    trainImageCount,
    trainImageCount + validTestImageCount,
  );
  const testImages = dataset.slice(trainImageCount + validTestImageCount);

  return {
    train: trainImages,
    valid: validImages,
    test: testImages,
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
  prevState: IAddImagesState | undefined,
  formData: FormData,
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
        inArray(tasks.id, taskIds),
      ),
    );

  const filteredTaskIds = filteredTasks.map((task) => task.id);

  const datasets: any = splitDataset(filteredTaskIds);

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
