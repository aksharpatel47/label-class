import { db } from "@/db";
import { projectLabels, projects, tasks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { unstable_noStore } from "next/cache";

export async function fetchProjects() {
  unstable_noStore();
  return db.query.projects.findMany({
    with: {
      creator: true,
      projectLabels: {
        orderBy: (labels, { asc }) => [asc(labels.sequence)],
      },
    },
  });
}

export async function fetchProjectLabelNames() {
  unstable_noStore();
  const results = await db
    .selectDistinct({
      labelName: projectLabels.labelName,
    })
    .from(projectLabels);

  return results.map((r) => r.labelName);
}

export async function fetchProjectsTaskCounts() {
  unstable_noStore();
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
  unstable_noStore();
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
}
