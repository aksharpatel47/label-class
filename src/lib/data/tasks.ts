import { db } from "@/db";
import { Task, taskLabels, tasks } from "@/db/schema";
import {
  SQL,
  and,
  asc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";
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
  currentUserId: string,
  projectId: string,
  after?: string | null,
  labeledBy?: string | null,
  labelId?: string | null,
  labelValue?: string | null
) {
  const filters: Array<SQL<unknown> | undefined> = [];
  filters.push(eq(tasks.projectId, projectId));
  if (labeledBy && labeledBy !== "Unlabeled") {
    filters.push(eq(taskLabels.labeledBy, labeledBy));
  }

  if (after) {
    filters.push(gt(tasks.createdAt, new Date(after)));
  }

  const userFilter = or(
    eq(tasks.assignedTo, currentUserId),
    isNull(tasks.assignedTo),
    lt(tasks.assignedOn, sql`now() - interval '15 minutes'`)
  );

  filters.push(userFilter);

  if (labelId && labelValue) {
    if (labelValue === "Unlabeled") {
      filters.push(isNull(taskLabels.labelId));
    } else {
      filters.push(
        eq(taskLabels.labelId, labelId),
        eq(taskLabels.value, labelValue as any)
      );
    }
  }

  const assignedTasksSQL = db
    .select({
      id: tasks.id,
      imageUrl: tasks.imageUrl,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .leftJoin(taskLabels, eq(taskLabels.taskId, tasks.id))
    .orderBy(asc(tasks.createdAt))
    .groupBy(
      tasks.id,
      taskLabels.labelId,
      taskLabels.value,
      taskLabels.labeledBy
    )
    .having(and(...filters))
    .limit(50);

  const assignedTasks = await assignedTasksSQL;
  if (!assignedTasks.length) {
    return assignedTasks;
  }

  await db
    .update(tasks)
    .set({
      assignedTo: currentUserId,
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
