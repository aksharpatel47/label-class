import { db } from "@/db";
import { Task, taskLabels, tasks } from "@/db/schema";
import { and, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";

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

export function fetchTasksInProject(
  projectId: string,
  page: number
): Promise<
  (Task & { taskLabels: { labelName: string; userName: string }[] })[]
> {
  // raw sql
  return db.execute(sql`
    select t.id, t.name, t.image_url as "imageUrl", 
    coalesce(json_agg(json_build_object('labelName', pl.label_name, 'userName', u.name)) FILTER (WHERE pl.label_name IS NOT NULL), '[]') as "taskLabels"
    from tasks as t 
    left join task_labels as tl on tl.task_id = t.id
    left join project_labels as pl on pl.id = tl.label_id
    left join auth_user as u on u.id = tl.labeled_by
    group by t.id
    having t.project_id = ${projectId}
    order by t.updated_at desc
    limit 50 offset ${(page - 1) * 50}
  `);
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
