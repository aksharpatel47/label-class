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

export async function fetchTasksInProject(projectId: string, page: number) {
  unstable_noStore();
  const maxPerPage = 50;

  return db.query.tasks.findMany({
    where: eq(tasks.projectId, projectId),
    limit: maxPerPage,
    offset: (page - 1) * maxPerPage,
    orderBy: (tasks, { desc }) => desc(tasks.updatedAt),
  });
}

export function fetchNumberOfTasksInProject(
  projectId: string
): Promise<number> {
  return db
    .select({
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .then((res) => res[0].count);
}

export async function fetchTasksForLabeling(
  userId: string,
  projectId: string,
  labelId?: string | null,
  labelValue?: string | null
) {
  const userFilter = or(
    eq(tasks.assignedTo, userId),
    isNull(tasks.assignedTo),
    lt(tasks.assignedOn, sql`now() - interval '15 minutes'`)
  );

  const labelValueFilter = !labelId
    ? userFilter
    : !labelValue || labelValue === "Unlabeled"
      ? and(sql`count(${taskLabels.id}) = 0`, userFilter)
      : and(
          eq(taskLabels.labelId, labelId),
          eq(taskLabels.value, labelValue as any),
          userFilter
        );

  const assignedTasksSQL = db
    .select({
      id: tasks.id,
      imageUrl: tasks.imageUrl,
    })
    .from(tasks)
    .leftJoin(taskLabels, eq(taskLabels.taskId, tasks.id))
    .groupBy(tasks.id, taskLabels.labelId, taskLabels.value)
    .having(and(eq(tasks.projectId, projectId), labelValueFilter))
    .limit(50);

  const gSQL = assignedTasksSQL.toSQL();

  console.log(gSQL);

  const assignedTasks = await assignedTasksSQL;
  if (!assignedTasks.length) {
    return assignedTasks;
  }

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
