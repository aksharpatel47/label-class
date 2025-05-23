import { db } from "@/db";
import {
  projectTaskSelections,
  taskInferences,
  taskLabels,
  tasks,
} from "@/db/schema";
import { and, asc, eq, gte, inArray, isNull, lte, SQL, sql } from "drizzle-orm";
import { unstable_noStore } from "next/cache";
import { PgTransaction } from "drizzle-orm/pg-core";
import postgres from "postgres";

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

interface IFetchTasksForLabeling {
  currentUserId: string;
  projectId: string;
  after?: string | null;
  labeledBy?: string | null;
  labeledOn?: string | null;
  labelId?: string | null;
  labelValue?: string | null;
  trainedModel?: string | null;
  inferenceValue?: string | null;
  dataset?: string | null;
}

export async function fetchTasksForLabeling(
  queryParams: IFetchTasksForLabeling,
) {
  const {
    currentUserId,
    projectId,
    after,
    labeledBy,
    labeledOn,
    labelId,
    labelValue,
    trainedModel,
    inferenceValue,
    dataset,
  } = queryParams;
  let sl = db
    .select({
      id: tasks.id,
      name: tasks.name,
      imageUrl: tasks.imageUrl,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    // .leftJoin(taskLabels, eq(tasks.id, taskLabels.taskId))
    .$dynamic();

  const filters: Array<SQL | undefined> = [];

  filters.push(eq(tasks.projectId, projectId));

  if (labeledBy || labeledOn || (labelId && labelValue)) {
    sl = sl.leftJoin(taskLabels, eq(tasks.id, taskLabels.taskId)).$dynamic();
  }

  if (labeledBy) {
    filters.push(eq(taskLabels.labeledBy, labeledBy));
  }

  if (labeledOn) {
    const labeledOnDate = new Date(labeledOn);
    const lteDate = new Date(
      Date.UTC(
        labeledOnDate.getUTCFullYear(),
        labeledOnDate.getUTCMonth(),
        labeledOnDate.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
    const gteDate = new Date(
      Date.UTC(
        labeledOnDate.getUTCFullYear(),
        labeledOnDate.getUTCMonth(),
        labeledOnDate.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    filters.push(
      and(
        gte(taskLabels.createdAt, gteDate),
        lte(taskLabels.createdAt, lteDate),
      ),
    );
  }

  if (labelId && labelValue) {
    if (labelValue === "Unlabeled") {
      filters.push(isNull(taskLabels.labelId));
    } else {
      filters.push(
        eq(taskLabels.labelId, labelId),
        eq(taskLabels.value, labelValue as any),
      );
    }
  } else if (labelId) {
    sl = sl.leftJoin(taskLabels, eq(tasks.id, taskLabels.taskId)).$dynamic();
    filters.push(eq(taskLabels.labelId, labelId));
  }

  if (after) {
    filters.push(sql`${tasks.id} > ${after}`);
  }

  if (trainedModel && inferenceValue) {
    const trainedModelId = Number(trainedModel);

    if (inferenceValue === ">=50%") {
      sl = sl
        .leftJoin(taskInferences, eq(tasks.name, taskInferences.imageName))
        .$dynamic();
      filters.push(
        and(
          eq(taskInferences.modelId, trainedModelId),
          gte(taskInferences.inference, 5000),
        ),
      );
    } else if (inferenceValue === "<50%") {
      sl = sl
        .leftJoin(taskInferences, eq(tasks.name, taskInferences.imageName))
        .$dynamic();
      filters.push(
        and(
          eq(taskInferences.modelId, trainedModelId),
          lte(taskInferences.inference, 5000),
        ),
      );
    } else {
      const inferenceValueRange = inferenceValue
        .slice(0, -1)
        .split("-")
        .map(Number)
        .filter((n) => !isNaN(n))
        .map((n) => Math.ceil(n * 100));

      if (
        inferenceValueRange.length === 2 &&
        inferenceValueRange[0] < inferenceValueRange[1] &&
        trainedModelId > 0
      ) {
        sl = sl
          .leftJoin(taskInferences, eq(tasks.name, taskInferences.imageName))
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
  }

  if (dataset && labelId) {
    sl = sl
      .leftJoin(
        projectTaskSelections,
        eq(tasks.id, projectTaskSelections.taskId),
      )
      .$dynamic();

    if (dataset === "any") {
      filters.push(eq(projectTaskSelections.labelId, labelId));
    } else if (dataset === "none") {
      filters.push(isNull(projectTaskSelections.labelId));
    } else {
      filters.push(
        and(
          eq(projectTaskSelections.dataset, dataset as any),
          eq(projectTaskSelections.labelId, labelId),
        ),
      );
    }
  }

  const results: any = await sl
    .where(and(...filters))
    .orderBy(asc(tasks.id))
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

/**
 *
 * @param tx - The transaction to use
 * @param projectId - The project id to add inferences for
 */
export function addInferencesForTasks(tx: postgres.TransactionSql) {
  //language=PostgreSQL
  return;
}

export function addLabelsForTasks(
  tx: PgTransaction<any, any, any>,
  projectId: string,
  labeledBy: string,
) {
  //language=PostgreSQL
  return tx.execute(sql`
        insert into task_labels
            (task_id, label_id, label_value, labeled_by)
        select t.id, tmp.label_id, tmp.label_value, ${labeledBy}
        from tasks t
                 inner join temp_tasks tmp on t.name = tmp.task_name
        where t.project_id = ${projectId}
          and tmp.label_id is not null
          and tmp.label_value is not null
        on conflict (task_id, label_id) do update
            set label_value      = excluded.label_value,
                updated_at       = now(),
                label_updated_by = ${labeledBy};
    `);
}

export function addDatasetForTasks(
  tx: PgTransaction<any, any, any>,
  projectId: string,
  labelId: string,
) {
  //language=PostgreSQL
  return tx.execute(sql`
        insert into project_task_selections
            (task_id, label_id, dataset)
        select t.id, ${labelId}, tmp.dataset
        from tasks t
                 inner join temp_tasks tmp on t.name = tmp.task_name
        where t.project_id = ${projectId}
          and tmp.dataset is not null
        on conflict (task_id, label_id) do update
            set dataset = excluded.dataset;
    `);
}
