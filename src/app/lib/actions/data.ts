"use server";

import { db, sql as dbSQL } from "@/db";
import { tempTasks } from "@/db/schema";
import { validateRequest } from "@/lib/auth/auth";
import { addDatasetForTasks, addLabelsForTasks } from "@/lib/data/tasks";
import { eq, sql } from "drizzle-orm";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export async function importData(
  projectId: string,
  userId: string,
  prevState: string | undefined,
  formData: FormData
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
        `Inserting ${tempTaskRows.length} tasks into the temp_tasks table.`
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
  modelId: number,
  prevState: string | undefined,
  formData: FormData
) {
  const result = await validateRequest();

  if (!result) {
    return "Not logged in.";
  }

  const file = formData.get("file") as File;

  if (!file) {
    return "No file uploaded";
  }
  // Check if the name of the file ends with a .csv
  if (!file.name.endsWith(".csv")) {
    return "File is not a CSV file.";
  }

  const fileContents = await file.text();

  const rows = fileContents
    .split("\n")
    .slice(1)
    .filter((row) => row.trim() !== "");

  // Use a Map to deduplicate by image name, keeping the last occurrence
  const inferenceMap = new Map<
    string,
    { inference: number; modelId: number }
  >();

  rows.forEach((row) => {
    const rowValues = row.split(",");
    if (rowValues.length < 2) {
      return; // Skip malformed rows
    }
    const imageName = rowValues[0]?.trim();
    const inference = rowValues[rowValues.length - 1]?.trim();

    if (!imageName || !inference) {
      return; // Skip rows with missing data
    }

    const inferenceNumber = Number(inference);
    if (isNaN(inferenceNumber)) {
      return; // Skip rows with invalid inference values
    }

    const inferenceValue = Math.ceil(inferenceNumber * 10000);
    inferenceMap.set(imageName, { inference: inferenceValue, modelId });
  });

  if (inferenceMap.size === 0) {
    return "No valid inference data found in the CSV file.";
  }

  const tempInferenceRows: string[] = Array.from(inferenceMap.entries()).map(
    ([imageName, { inference, modelId }]) =>
      `${imageName}\t${inference}\t${modelId}\n`
  );

  const tempInferences = Readable.from(tempInferenceRows);

  console.log(
    `Inserting ${tempInferenceRows.length} unique inferences into the temp_tasks table (deduplicating from ${rows.length} total rows).`
  );

  await dbSQL.begin(async (tx) => {
    // clear the temp_tasks table
    // language=PostgreSQL
    await tx`truncate temp_tasks`;
    // language=PostgreSQL
    const query =
      await tx`copy temp_tasks (task_name, inference, model_id) from stdin`.writable();
    await pipeline(tempInferences, query);

    console.log(
      `Inserted inferences from the temp_tasks table to the task_inferences table.`
    );
    // Insert the inferences into the task_inferences table
    // language=PostgreSQL
    await tx`
            insert into task_inferences
                (image_name, model_id, inference)
            select t.task_name, t.model_id, t.inference
            from temp_tasks t
            where t.model_id is not null
              and t.inference is not null
            on conflict (image_name, model_id) do update
                set inference  = excluded.inference,
                    updated_at = now();
        `;

    console.log(
      `Inserted inferences into the task_inferences table for model ${modelId} from the temp_tasks table.`
    );

    await tx`truncate temp_tasks`;

    console.log(`Cleared temp_tasks table for model ${modelId}.`);
  });

  return "Done";
}

export async function importDataset(
  projectId: string,
  state: string | undefined,
  formData: FormData
) {
  const result = await validateRequest();
  if (!result) {
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
        `${task.taskName}\t${task.labelId}\t${task.dataset}\t${projectId}\n`
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
  formData: FormData
) {
  const result = await validateRequest();
  if (!result) {
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
        `
  );

  return "Done";
}
