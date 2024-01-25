import { db } from "@/db";
import {
  authUser,
  projectLabels,
  taskLabels,
  taskLabelsRelations,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { unstable_noStore } from "next/cache";

export async function addLabelToTask(
  taskId: string,
  labelMap: Record<string, string>,
  labelName: string,
  labelValue: string,
  userId: string,
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

/**
 * Fetches the label statistics for a given project
 * @param projectId
 */
export async function fetchTaskLabelStatistics(projectId: string) {
  unstable_noStore();

  return db
    .select({
      labelId: taskLabels.labelId,
      labelName: projectLabels.labelName,
      user: authUser.name,
      labelValue: taskLabels.value,
      count: sql<number>`count(*)::int`,
    })
    .from(taskLabels)
    .innerJoin(projectLabels, eq(taskLabels.labelId, projectLabels.id))
    .innerJoin(authUser, eq(taskLabels.labeledBy, authUser.id))
    .where(and(eq(projectLabels.projectId, projectId)))
    .groupBy(
      taskLabels.labelId,
      taskLabels.value,
      projectLabels.labelName,
      authUser.id,
    );
}
