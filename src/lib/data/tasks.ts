import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export function addTaskInProject(projectId: number, name: string, url: string) {
  return db
    .insert(tasks)
    .values({
      name,
      imageUrl: url,
      projectId,
    })
    .onConflictDoUpdate({
      target: [tasks.projectId, tasks.imageUrl],
      set: {
        updatedAt: sql`now()`,
      },
    })
    .returning({ insertedId: tasks.id });
}

export function fetchTasksInProject(projectId: number, page: number) {
  return db.query.tasks.findMany({
    where: eq(tasks.projectId, projectId),
    limit: 50,
    offset: (page - 1) * 50,
    with: {
      taskLabels: true,
    },
  });
}

export function fetchNumberOfTasksInProject(projectId: number) {
  return db
    .select({
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .then((res) => res[0].count);
}
