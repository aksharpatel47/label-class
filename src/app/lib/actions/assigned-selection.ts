"use server";

import { db, sql } from "@/db";
import {
  datasetEnum,
  ProjectTaskSelectionInsert,
  projectTaskSelections,
  taskAssignments,
  TaskLabelValue,
  taskLabelValue,
} from "@/db/schema";
import z from "zod";
import { splitDataset } from "@/app/lib/utils/dataset";
import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";

const assignedSelectionSchema = z.object({
  labelId: z.string(),
  assignedUserId: z.string(),
  projectId: z.string(),
  labelValue: z.enum(taskLabelValue.enumValues),
  dataset: z.enum([...datasetEnum.enumValues, "split"]),
});

async function fetchAssignedTasksIds(
  projectId: string,
  labelId: string,
  assignedUserId: string,
  labelValue: TaskLabelValue
) {
  return sql<{ id: string }[]>`
    select t.id from tasks t
    inner join task_assignments ta on t.id = ta.task_id
    inner join task_labels tl on t.id = tl.task_id
    where t.project_id = ${projectId}
        and ta.label_id = ${labelId}
        and ta.user_id = ${assignedUserId}
        and tl.label_value = ${labelValue}
        and tl.label_id = ${labelId}
    `;
}

export async function assignedSelectionAction(
  prevState: any | undefined,
  formData: FormData
) {
  const parsedObject = assignedSelectionSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!parsedObject.success) {
    return { error: "Invalid assigned selection data" };
  }

  const { labelId, assignedUserId, projectId, labelValue, dataset } =
    parsedObject.data;

  const tasks = await fetchAssignedTasksIds(
    projectId,
    labelId,
    assignedUserId,
    labelValue
  );

  const taskIds = tasks.map((task) => task.id);

  const datasets: Record<string, string[]> =
    dataset === "split" ? splitDataset(taskIds) : { [dataset]: taskIds };

  let projectTaskSelectionInserts: ProjectTaskSelectionInsert[] = [];

  for (const dsName in datasets) {
    for (const taskId of datasets[dsName]) {
      projectTaskSelectionInserts.push({
        taskId,
        labelId,
        dataset: dsName as (typeof datasetEnum.enumValues)[number],
      });
    }
  }

  try {
    await db.insert(projectTaskSelections).values(projectTaskSelectionInserts);
  } catch (error) {
    return { error: "Error assigning selection to tasks" };
  }

  await db
    .delete(taskAssignments)
    .where(
      and(
        inArray(taskAssignments.taskId, taskIds),
        eq(taskAssignments.labelId, labelId),
        eq(taskAssignments.userId, assignedUserId)
      )
    );

  revalidatePath(`/projects/${projectId}/assigned-selection`, "page");
  redirect(`/projects/${projectId}/statistics/dataset`, RedirectType.push);
}
