import { db } from "@/db";
import { projectLabels, taskLabels } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { unstable_noStore } from "next/cache";

export async function addLabelToTask(
  taskId: string,
  labelMap: Record<string, string>,
  labelName: string,
  labelValue: string,
  userId: string
) {
  unstable_noStore();

  return db
    .insert(taskLabels)
    .values({
      taskId,
      labelId: labelMap[labelName],
      value: labelValue as any,
      labeledBy: userId,
    })
    .onConflictDoNothing();
}

export async function fetchProjectLabels(projectId: string) {
  unstable_noStore();
  return db.query.projectLabels.findMany({
    where: eq(projectLabels.projectId, projectId),
    orderBy: (p, { asc }) => [asc(p.sequence)],
  });
}
