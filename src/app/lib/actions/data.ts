"use server";

import { db } from "@/db";
import {
  TaskInsert,
  tasks,
  tempTaskInferences,
  TempTaskInferences,
} from "@/db/schema";
import { addInferencesForTasks } from "@/lib/data/tasks";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getPageSession } from "../utils/session";

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

  const fileContents = await file.text();
  try {
    const data = JSON.parse(fileContents);
    if (!data) {
      return "No data in file";
    }

    const dataKeys = Object.keys(data);
    const tasksToInsert: TaskInsert[] = [];
    for (const key of dataKeys) {
      const item = data[key];
      const imageUrl = new URL(key);
      const fileName = imageUrl.pathname.split("/").pop();

      tasksToInsert.push({
        name: fileName!,
        imageUrl: key,
        projectId,
      });
    }

    const batchSize = 1000;
    const batches = Math.ceil(tasksToInsert.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = start + batchSize;
      await db
        .insert(tasks)
        .values(tasksToInsert.slice(start, end))
        .onConflictDoNothing();
    }

    revalidatePath(`/api/projects/${projectId}/tasks`);

    return "Done";
  } catch (error) {
    console.error(error);
    return "File is not valid JSON";
  }
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

  const tempInferences: TempTaskInferences[] = rows.map((row) => {
    const rowValues = row.split(",");
    const imageName = rowValues[0];
    const inference = rowValues[rowValues.length - 1];
    const inferenceValue = Math.ceil(Number(inference) * 100);
    return {
      modelId: trainedModelId,
      inference: inferenceValue,
      projectId: projectId,
      taskName: imageName,
    };
  });

  console.log(
    `Inserting ${tempInferences.length} inferences into the temp_task_inferences table.`,
  );

  await db.transaction(async (tx) => {
    const batchSize = 1000;
    const batches = Math.ceil(tempInferences.length / batchSize);

    console.log(
      `Clearing temp_task_inferences table for project ${projectId}.`,
    );

    await tx
      .delete(tempTaskInferences)
      .where(eq(tempTaskInferences.projectId, projectId));

    console.log(
      `Inserting ${batches} batches of inferences with each batch of size 1000.`,
    );

    // Insert the inferences into the temp_task_inferences table
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = start + batchSize;
      await tx
        .insert(tempTaskInferences)
        .values(tempInferences.slice(start, end));

      console.log(`Inserted batch ${i + 1} of ${batches}`);
    }

    console.log(
      `Inserted inferences from the temp_task_inferences table to the tasks table.`,
    );
    // Insert the inferences into the task_inferences table
    await addInferencesForTasks(tx, projectId);

    console.log(
      `Inserted inferences into the task_inferences table for project ${projectId} from the temp_task_inferences table.`,
    );

    // Remove the inferences from the temp_task_inferences table
    await tx
      .delete(tempTaskInferences)
      .where(eq(tempTaskInferences.projectId, projectId));

    console.log(
      `Deleted inferences from the temp_task_inferences table for project ${projectId}.`,
    );
  });

  revalidatePath(`/api/projects/${projectId}/tasks`);

  return "Done";
}
