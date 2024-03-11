"use server";

import { db } from "@/db";
import { TaskInsert, tasks, TempTaskInsert, tempTasks } from "@/db/schema";
import { addInferencesForTasks, addLabelsForTasks } from "@/lib/data/tasks";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getPageSession } from "../utils/session";
import { redirect } from "next/navigation";

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

  const tasksToInsert: TaskInsert[] = rows
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
    .filter((task) => task.name && task.imageUrl);

  const batchSize = 1000;
  await db.transaction(async (tx) => {
    const batches = Math.ceil(tasksToInsert.length / batchSize);
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = start + batchSize;
      await tx
        .insert(tasks)
        .values(tasksToInsert.slice(start, end))
        .onConflictDoNothing();
    }

    if (label && label !== "None") {
      const tempTaskRows: TempTaskInsert[] = rows.map((row) => {
        const rowValues = row.split(",");
        const imageName = rowValues[0];
        const labelValue: any = rowValues[2];
        return {
          taskName: imageName,
          labelValue,
          projectId,
          labelId: label,
        };
      });

      const batches = Math.ceil(tempTaskRows.length / batchSize);
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = start + batchSize;
        await tx.insert(tempTasks).values(tempTaskRows.slice(start, end));
      }

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

  const tempInferences: TempTaskInsert[] = rows.map((row) => {
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

    await tx.delete(tempTasks).where(eq(tempTasks.projectId, projectId));

    console.log(
      `Inserting ${batches} batches of inferences with each batch of size 1000.`,
    );

    // Insert the inferences into the temp_task_inferences table
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = start + batchSize;
      await tx.insert(tempTasks).values(tempInferences.slice(start, end));

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
    await tx.delete(tempTasks).where(eq(tempTasks.projectId, projectId));

    console.log(
      `Deleted inferences from the temp_task_inferences table for project ${projectId}.`,
    );
  });

  revalidatePath(`/api/projects/${projectId}/tasks`);

  return "Done";
}
