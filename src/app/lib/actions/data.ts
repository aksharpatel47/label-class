"use server";

import { db, sql as dbSQL } from "@/db";
import { tempTasks } from "@/db/schema";
import {
  addDatasetForTasks,
  addInferencesForTasks,
  addLabelsForTasks,
} from "@/lib/data/tasks";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getPageSession } from "../utils/session";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export async function importData(
  projectId: string,
  userId: string,
  prevState: string | undefined,
  formData: FormData,
) {
  const file = formData.get("file") as File;
  if (!file) {
    return "No file uploaded";
  }
  const label = formData.get("label") as string;

  const fileContents = await file.text();
  const rows = fileContents.split("\n").slice(1);
  const firstRow = rows[0].split(",");

  if (firstRow.length < 2) {
    return "CSV file is missing required columns.";
  }
  if (label && label !== "None" && firstRow.length < 3) {
    return "Label column is missing from the CSV file.";
  }

  const tasksToInsert: string[] = rows
    .map((row) => {
      const rowValues = row.split(",");
      const imageName = rowValues[0];
      const imageUrl = rowValues[1];
      return {
        name: imageName,
        imageUrl,
        projectId,
      };
    })
    .filter((task) => task.name && task.imageUrl)
    .map((task) => `${task.name}\t${task.imageUrl}\t${projectId}\n`);

  const batchSize = 1000;
  await db.transaction(async (tx) => {
    // language=PostgreSQL
    const query =
      await dbSQL`copy tasks (name, image_url, project_id) from stdin`.writable();
    await pipeline(Readable.from(tasksToInsert), query);

    if (label && label !== "None") {
      const tempTaskRows: string[] = rows.map((row) => {
        const rowValues = row.split(",");
        const imageName = rowValues[0];
        const labelValue: any = rowValues[2];
        return `${imageName}\t${labelValue}\t${projectId}\t${label}\n`;
      });

      const tempTaskReadable = Readable.from(tempTaskRows);

      console.log(
        `Inserting ${tempTaskRows.length} tasks into the temp_tasks table.`,
      );

      // language=PostgreSQL
      const tempQuery =
        await dbSQL`copy temp_tasks (task_name, label_value, project_id, label_id) from stdin`.writable();
      await pipeline(tempTaskReadable, tempQuery);
      await addLabelsForTasks(tx, projectId, userId);
      await tx.delete(tempTasks).where(eq(tempTasks.projectId, projectId));
    }
  });
}

export async function importInference(
  projectId: string,
  prevState: string | undefined,
  formData: FormData,
) {
  const session = await getPageSession();

  if (!session) {
    return "Not logged in.";
  }

  const trainedModelId = Number(formData.get("trainedModel") as string);
  const file = formData.get("file") as File;

  if (!file) {
    return "No file uploaded";
  }
  // Check if the name of the file ends with a .csv
  if (!file.name.endsWith(".csv")) {
    return "File is not a CSV file.";
  }

  const fileContents = await file.text();

  const rows = fileContents.split("\n").slice(1);

  const tempInferenceRows: string[] = rows.map((row) => {
    const rowValues = row.split(",");
    const imageName = rowValues[0];
    const inference = rowValues[rowValues.length - 1];
    const inferenceValue = Math.ceil(Number(inference) * 100);
    return `${imageName}\t${inferenceValue}\t${trainedModelId}\t${projectId}\n`;
  });
  const tempInferences = Readable.from(tempInferenceRows);

  console.log(
    `Inserting ${tempInferenceRows.length} inferences into the temp_task_inferences table.`,
  );

  await db.transaction(async (tx) => {
    // language=PostgreSQL
    const query =
      await dbSQL`copy temp_tasks (task_name, inference, model_id, project_id) from stdin`.writable();
    await pipeline(tempInferences, query);

    console.log(
      `Inserted inferences from the temp_task_inferences table to the tasks table.`,
    );
    // Insert the inferences into the task_inferences table
    await addInferencesForTasks(tx, projectId);

    console.log(
      `Inserted inferences into the task_inferences table for project ${projectId} from the temp_task_inferences table.`,
    );

    // Remove the inferences from the temp_task_inferences table
    await tx.delete(tempTasks).where(eq(tempTasks.projectId, projectId));

    console.log(
      `Deleted inferences from the temp_task_inferences table for project ${projectId}.`,
    );
  });

  revalidatePath(`/api/projects/${projectId}/tasks`);

  return "Done";
}

export async function importDataset(
  projectId: string,
  state: string | undefined,
  formData: FormData,
) {
  const session = await getPageSession();
  if (!session) {
    return "Not logged in.";
  }

  const file = formData.get("file") as File;
  const labelId = formData.get("label") as string;

  if (!file) {
    return "No file uploaded";
  }

  if (!labelId) {
    return "No label selected";
  }

  const fileContents = await file.text();

  const rows = fileContents.split("\n").slice(1);

  const tempTasksInserts: string[] = rows
    .map((row) => {
      const rowValues = row.split(",");
      const taskName = rowValues[0];
      const dataset: any = rowValues[rowValues.length - 1];
      return {
        taskName,
        labelId,
        dataset,
        projectId,
      };
    })
    .filter((task) => task.taskName && task.dataset)
    .map(
      (task) =>
        `${task.taskName}\t${task.labelId}\t${task.dataset}\t${projectId}\n`,
    );

  await db.transaction(async (tx) => {
    // language=PostgreSQL
    const query =
      await dbSQL`copy temp_tasks (task_name, label_id, dataset, project_id) from stdin`.writable();
    await pipeline(Readable.from(tempTasksInserts), query);

    await addDatasetForTasks(tx, projectId, labelId);

    await tx.delete(tempTasks).where(eq(tempTasks.projectId, projectId));
  });
}

export async function clearDataset(
  projectId: string,
  state: string | undefined,
  formData: FormData,
) {
  const session = await getPageSession();
  if (!session) {
    return "Not logged in.";
  }

  const labelId = formData.get("label") as string;

  if (!labelId) {
    return "No label selected";
  }

  await db.execute(
    sql`delete
            from project_task_selections
            where task_id in (select id from tasks where project_id = ${projectId})
              and label_id = ${labelId};
        `,
  );

  return "Done";
}
