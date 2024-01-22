"use server";

import { db } from "@/db";
import { projectLabels } from "@/db/schema";
import { addLabelToTask } from "@/lib/data/labels";
import { addInferenceForTask, addTaskInProject } from "@/lib/data/tasks";
import { fetchUserById } from "@/lib/data/users";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getPageSession } from "../utils/session";

interface IAnnotation {
  label: string;
  labeledBy: string | undefined;
}

interface IImageData {
  url: string;
  annotations: IAnnotation[];
}

interface ILabelStudJsonData {
  annotations: {
    result: {
      value: {
        choices: string[];
      };
    }[];
  }[];
  data: {
    image: string;
  };
}

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

  const fileContents = await file.text();
  try {
    const data = JSON.parse(fileContents);
    if (!data) {
      return "No data in file";
    }

    const user = await fetchUserById(userId);
    const labelMap = await db.query.projectLabels
      .findMany({
        where: eq(projectLabels.projectId, projectId),
      })
      .then((labels) =>
        labels.reduce(
          (acc, label) => {
            acc[label.labelName] = label.id;
            return acc;
          },
          {} as Record<string, string>
        )
      );

    const dataKeys = Object.keys(data);
    for (let i = 0; i < dataKeys.length; i++) {
      const key = dataKeys[i];
      const item = data[key];
      const imageUrl = new URL(key);
      const fileName = imageUrl.pathname.split("/").pop();
      const task = await addTaskInProject(projectId, fileName!, key);
      const taskId = task[0].insertedId;

      if (item === null) {
        continue;
      }

      const itemKeys = Object.keys(item);

      for (let j = 0; j < itemKeys.length; j++) {
        const itemKey = itemKeys[j];
        const annotation = item[itemKey];

        if (annotation === null) {
          continue;
        }

        await addLabelToTask(taskId, labelMap, itemKey, annotation, user!.id);
      }
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
  formData: FormData
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

  for (const row of rows) {
    const rowValues = row.split(",");
    const imageName = rowValues[0];
    const inference = rowValues[rowValues.length - 1];
    const inferenceValue = Math.ceil(Number(inference) * 100);
    await addInferenceForTask(
      projectId,
      imageName,
      trainedModelId,
      inferenceValue
    );
  }

  return "Done";
}
