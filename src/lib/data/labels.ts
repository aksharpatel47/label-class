import { db } from "@/db";
import { projectLabels, taskLabels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_noStore } from "next/cache";

export async function addLabelToTask(
  taskId: string,
  labelMap: Record<string, string>,
  labelNames: string[],
  userId: string
) {
  unstable_noStore();
  const values = labelNames.map((labelName) => ({
    taskId,
    labelId: labelMap[labelName],
    labeledBy: userId,
  }));
  return db.insert(taskLabels).values(values).onConflictDoNothing();
}

export async function fetchProjectLabels(projectId: string) {
  unstable_noStore();
  return db.query.projectLabels.findMany({
    where: eq(projectLabels.projectId, projectId),
    orderBy: (p, { asc }) => [asc(p.sequence)],
  });
}
