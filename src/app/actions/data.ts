"use server";

import { addLabelToTask } from "@/lib/data/labels";
import { addTaskInProject } from "@/lib/data/tasks";
import { fetchUserByEmail } from "@/lib/data/users";

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
  projectId: number,
  userEmail: string,
  prevState: string | undefined,
  formData: FormData
) {
  const file = formData.get("file") as File;
  if (!file) {
    return "No file uploaded";
  }

  const fileContents = await file.text();
  try {
    const data: ILabelStudJsonData[] = JSON.parse(fileContents);
    if (!data) {
      return "No data in file";
    }

    const user = await fetchUserByEmail(userEmail);
    for (const item of data) {
      const imageUrl = new URL(item.data.image);
      const fileName = imageUrl.pathname.split("/").pop();
      const task = await addTaskInProject(
        projectId,
        fileName!,
        item.data.image
      );
      const taskId = task[0].insertedId;
      for (const annotation of item.annotations) {
        for (const result of annotation.result) {
          const labels = result.value.choices;
          await addLabelToTask(taskId, labels, user!.id);
        }
      }
    }

    return "Done";
  } catch (error) {
    console.error(error);
    return "File is not valid JSON";
  }
}
