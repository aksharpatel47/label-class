import { db } from "@/db";
import { Task, taskLabels, tasks } from "@/db/schema";
import { and, eq, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { unstable_noStore } from "next/cache";

export function addTaskInProject(projectId: string, name: string, url: string) {
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

export async function fetchTasksInProject(
  projectId: string,
  page: number,
  user: string
) {
  unstable_noStore();
  console.log("fetchTasksInProject", projectId, page, user);
  const maxPerPage = 50;

  const userFilter =
    user === "none"
      ? isNull(taskLabels.labelId)
      : user !== ""
        ? eq(taskLabels.labeledBy, user)
        : sql`true`;

  const sqlQuery = db
    .select()
    .from(tasks)
    .leftJoin(taskLabels, eq(tasks.id, taskLabels.taskId))
    .where(and(userFilter, eq(tasks.projectId, projectId)))
    .limit(maxPerPage)
    .offset((page - 1) * maxPerPage)
    .toSQL();

  console.log("sqlQuery", sqlQuery);

  const results = await db
    .select()
    .from(tasks)
    .leftJoin(taskLabels, eq(tasks.id, taskLabels.taskId))
    .where(and(userFilter, eq(tasks.projectId, projectId)))
    .limit(maxPerPage)
    .offset((page - 1) * maxPerPage);

  console.log(JSON.stringify(results, null, 2));

  return results;
}

export function fetchNumberOfTasksInProject(projectId: string) {
  return db
    .select({
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .then((res) => res[0].count);
}

export async function fetchTasksForLabeling(userId: string, projectId: string) {
  const assignedTasks = await db
    .select({
      id: tasks.id,
      imageUrl: tasks.imageUrl,
    })
    .from(tasks)
    .leftJoin(taskLabels, eq(taskLabels.taskId, tasks.id))
    .groupBy(tasks.id)
    .having(
      and(
        sql`count(${taskLabels.id}) = 0`,
        eq(tasks.projectId, projectId),
        or(
          eq(tasks.assignedTo, userId),
          isNull(tasks.assignedTo),
          lt(tasks.assignedOn, sql`now() - interval '15 minutes'`)
        )
      )
    )
    .limit(50);

  await db
    .update(tasks)
    .set({
      assignedTo: userId,
      assignedOn: sql`now()`,
    })
    .where(
      inArray(
        tasks.id,
        assignedTasks.map((t) => t.id)
      )
    );

  return assignedTasks;
}
