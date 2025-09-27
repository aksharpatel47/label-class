import { db } from "@/db";
import { projectLabels, projects, tasks } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

export async function fetchProjects() {
  return db.query.projects.findMany({
    with: {
      creator: true,
      projectLabels: {
        orderBy: (labels, { asc }) => [asc(labels.sequence)],
      },
    },
    orderBy: (projects, { asc }) => [
      asc(projects.sequence),
      asc(projects.name),
    ],
  });
}

export async function fetchProjectsWithIds(ids: string[]) {
  return db.query.projects.findMany({
    where: inArray(projects.id, ids),
    with: {
      projectLabels: {
        orderBy: (labels, { asc }) => [asc(labels.sequence)],
      },
    },
    orderBy: (projects, { asc }) => [
      asc(projects.sequence),
      asc(projects.name),
    ],
  });
}

export async function fetchProjectLabelNames() {
  const results = await db
    .selectDistinct({
      labelName: projectLabels.labelName,
    })
    .from(projectLabels);

  return results.map((r) => r.labelName);
}

/**
 * Fetch projects associated with a specific label name.
 * @param labelName - The name of the label to filter projects by. Eg. "Sidewalk", "Buffer", etc.
 * @returns A list of projects that have the specified label name.
 */
export async function fetchProjectsWithLabelName(labelName: string) {
  return db.query.projectLabels
    .findMany({
      where: eq(projectLabels.labelName, labelName),
      with: {
        project: true,
      },
    })
    .then((projectLabels) => projectLabels.map((pl) => pl.project));
}

export async function fetchProjectsTaskCounts() {
  return db
    .select({
      projectId: projects.id,
      count: sql`count(tasks.id)::integer`,
    })
    .from(projects)
    .leftJoin(tasks, eq(tasks.projectId, projects.id))
    .groupBy(projects.id);
}

export async function fetchProjectById(id: string) {
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
}
