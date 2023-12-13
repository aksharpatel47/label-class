"use server";

import { db } from "@/db";
import { projectLabels, projects } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string(),
  labels: z.string(),
});

export async function createProject(userId: string, project: FormData) {
  const parsedObject = createProjectSchema.safeParse(
    Object.fromEntries(project)
  );

  if (!parsedObject.success) {
    throw new Error("Invalid project data");
  }

  const { name, labels } = parsedObject.data;

  const result = await db
    .insert(projects)
    .values({
      name,
      createdBy: userId,
    })
    .returning({
      insertedId: projects.id,
    })
    .then((result) => result[0]);

  const labelValues = labels.split(",").map((label) => label.trim());

  await db.insert(projectLabels).values(
    labelValues.map((label, index) => ({
      labelName: label,
      sequence: index,
      projectId: result.insertedId,
    }))
  );

  revalidatePath("/projects");
  redirect("/projects");
}
