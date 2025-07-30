import { db } from "@/db";
import {
  authUser,
  projectLabels,
  projects,
  projectTaskSelections,
  taskLabels,
  taskLabelsRelations,
  tasks,
} from "@/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
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
      authUser.id
    );
}

/**
 * Fetches the dataset statistics for a given project for all the project labels
 * @param projectId
 */
export async function fetchDatasetStatistics(projectId: string) {
  unstable_noStore();

  return db
    .select({
      dataset: projectTaskSelections.dataset,
      labelName: projectLabels.labelName,
      labelValue: taskLabels.value,
      count: sql<number>`count(project_task_selections.task_id)::int`,
    })
    .from(projectTaskSelections)
    .innerJoin(tasks, eq(projectTaskSelections.taskId, tasks.id))
    .innerJoin(
      taskLabels,
      and(
        eq(tasks.id, taskLabels.taskId),
        eq(taskLabels.labelId, projectTaskSelections.labelId)
      )
    )
    .innerJoin(
      projectLabels,
      eq(projectTaskSelections.labelId, projectLabels.id)
    )
    .where(and(eq(tasks.projectId, projectId)))
    .groupBy(
      projectTaskSelections.dataset,
      projectLabels.labelName,
      taskLabels.value
    );
}

/**
 * Fetches the dataset statistics for a given label name across multiple projects
 * @param labelName Name of the label e.g. "Sidewalk", "Line Crosswalk", etc.
 * @param projectIds Array of project IDs to filter the statistics
 * @returns
 */
export async function fetchDatasetStatisticsByLabel(
  labelName: string,
  projectIds: string[]
) {
  unstable_noStore();

  return db
    .select({
      dataset: projectTaskSelections.dataset,
      labelValue: taskLabels.value,
      projectId: tasks.projectId,
      count: sql<number>`count(project_task_selections.task_id)::int`,
    })
    .from(projectTaskSelections)
    .innerJoin(tasks, eq(projectTaskSelections.taskId, tasks.id))
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(
      taskLabels,
      and(
        eq(tasks.id, taskLabels.taskId),
        eq(taskLabels.labelId, projectTaskSelections.labelId),
        inArray(taskLabels.value, ["Present", "Absent"])
      )
    )
    .innerJoin(
      projectLabels,
      and(
        eq(projectTaskSelections.labelId, projectLabels.id),
        eq(projectLabels.labelName, labelName),
        inArray(tasks.projectId, projectIds)
      )
    )
    .groupBy(projectTaskSelections.dataset, taskLabels.value, tasks.projectId)
    .orderBy(asc(projects.sequence), asc(projects.name));
}
