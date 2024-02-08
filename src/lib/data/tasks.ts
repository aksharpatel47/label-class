import { db } from "@/db";
import { taskInferences, taskLabels, tasks, trainedModels } from "@/db/schema";
import {
  SQL,
  and,
  asc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  lte,
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
  projectId: string,
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
  labelValue?: string | null,
  trainedModel?: string | null,
  inferenceValue?: string | null,
) {
  let sl = db
    .select({
      id: tasks.id,
      imageUrl: tasks.imageUrl,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .$dynamic();

  const filters: Array<SQL | undefined> = [];
  filters.push(eq(tasks.projectId, projectId));
  if (labelId && labelValue) {
    sl = sl.leftJoin(taskLabels, eq(tasks.id, taskLabels.taskId)).$dynamic();

    if (labelValue === "Unlabeled") {
      filters.push(isNull(taskLabels.labelId));
    } else {
      if (labeledBy) {
        filters.push(eq(taskLabels.labeledBy, labeledBy));
      }

      filters.push(
        eq(taskLabels.labelId, labelId),
        eq(taskLabels.value, labelValue as any),
      );
    }
  }

  if (after) {
    filters.push(sql`${tasks.createdAt} > ${after}`);
  }

  const userFilter = or(
    and(
      eq(tasks.assignedTo, currentUserId),
      gte(tasks.assignedOn, sql`now() - interval '15 minutes'`),
    ),
    isNull(tasks.assignedTo),
    lt(tasks.assignedOn, sql`now() - interval '15 minutes'`),
  );

  filters.push(userFilter);

  if (trainedModel && inferenceValue) {
    const trainedModelId = Number(trainedModel);
    const inferenceValueRange = inferenceValue
      .split("-")
      .map(Number)
      .filter((n) => !isNaN(n));

    if (
      inferenceValueRange.length === 2 &&
      inferenceValueRange[0] < inferenceValueRange[1] &&
      trainedModelId > 0
    ) {
      sl = sl
        .leftJoin(taskInferences, eq(tasks.id, taskInferences.taskId))
        .$dynamic();
      filters.push(
        and(
          eq(taskInferences.modelId, trainedModelId),
          gte(taskInferences.inference, inferenceValueRange[0]),
          lte(taskInferences.inference, inferenceValueRange[1]),
        ),
      );
    }
  }

  const results: any = await sl
    .where(and(...filters))
    .orderBy(asc(tasks.createdAt))
    .limit(50);

  if (!results.length) {
    return results;
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
        results.map((t: any) => t.id),
      ),
    );

  return results;
}

export async function addInferenceForTask(
  projectId: string,
  taskName: string,
  trainedModelId: number,
  inference: number,
) {
  const insertSQL = sql`
  insert into ${taskInferences}
  (task_id, model_id, inference)
  select id, ${trainedModelId}, ${inference}
  from ${tasks}
  where name=${taskName} and project_id=${projectId}
  on conflict (task_id, model_id) do update
  set inference=${inference}, updated_at=now()`;
  await db.execute(insertSQL);
}
