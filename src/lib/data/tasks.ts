import { db } from "@/db";
import {
  projectTaskSelections,
  taskAssignments,
  taskInferences,
  taskLabels,
  tasks,
} from "@/db/schema";
import { and, asc, eq, gte, isNull, lte, SQL, sql } from "drizzle-orm";
import { PgSelectBase, PgTransaction } from "drizzle-orm/pg-core";
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
  assignedUser?: string | null;
}

/**
 * Builds the select query and filter array for fetching tasks based on the provided query params.
 * Handles all supported filters and required joins for labeling task queries.
 *
 * @param oSQL - The base select query to start with
 * @param queryParams - The search/filter params for labeling
 * @returns { sl, filters } - The select query (with joins) and the array of filters to apply
 */
function generateFiltersBasedOnQueryParams(
  oSQL: PgSelectBase<any, any, any, any, any>,
  queryParams: IFetchTasksForLabeling,
): {
  sl: PgSelectBase<any, any, any, any, any>;
  filters: Array<SQL | undefined>;
} {
  let sl = oSQL;
  const {
    projectId,
    after,
    labeledBy,
    labeledOn,
    labelId,
    labelValue,
    trainedModel,
    inferenceValue,
    dataset,
    assignedUser,
  } = queryParams;

  const filters: Array<SQL | undefined> = [];

  // Always filter by projectId
  filters.push(eq(tasks.projectId, projectId));

  if (assignedUser && labelId) {
    sl = sl
      .innerJoin(
        taskAssignments,
        and(
          eq(taskAssignments.taskId, tasks.id),
          eq(taskAssignments.userId, assignedUser),
          eq(taskAssignments.labelId, labelId),
        ),
      )
      .$dynamic();
  }

  // If any label-based filter is present, join taskLabels
  if (labelId) {
    const joinCondition = and(
      eq(tasks.id, taskLabels.taskId),
      eq(taskLabels.labelId, labelId),
    );
    if (labelValue === "Unlabeled") {
      // If labelId is present but labelValue is 'Unlabeled', we need to
      // left join taskLabels to find tasks without this labelId
      sl = sl.leftJoin(taskLabels, joinCondition).$dynamic();
    } else {
      // For 'Any' and specific values, use inner join to get only labeled tasks
      sl = sl.innerJoin(taskLabels, joinCondition).$dynamic();
    }
  } else if (labeledBy || labeledOn) {
    sl = sl.innerJoin(taskLabels, eq(tasks.id, taskLabels.taskId)).$dynamic();
  }

  if (trainedModel) {
    // If trainedModel is present, we need to join taskInferences
    sl = sl
      .innerJoin(
        taskInferences,
        and(
          eq(tasks.name, taskInferences.imageName),
          eq(taskInferences.modelId, Number(trainedModel)),
        ),
      )
      .$dynamic();
  }

  // Filter by who labeled the task
  if (labeledBy) {
    filters.push(eq(taskLabels.labeledBy, labeledBy));
  }

  // Filter by date the task was labeled (on a specific day)
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

  // Filter by labelId and labelValue (including 'Unlabeled' and 'Any')
  if (labelId && labelValue === "Unlabeled") {
    // Only tasks with no label for this labelId
    filters.push(isNull(taskLabels.labelId));
  } else if (labelId && labelValue === "Any") {
    // Tasks with any label value (Present, Absent, Difficult, or Skip)
    // No additional filter needed - just the inner join ensures a label exists
  } else if (labelId && labelValue) {
    // Only tasks with this labelId and labelValue
    filters.push(eq(taskLabels.value, labelValue as any));
  }

  // Filter for tasks after a certain id (pagination)
  if (after) {
    filters.push(sql`${tasks.id} > ${after}`);
  }

  // Model inference-based filters
  if (trainedModel && inferenceValue) {
    const trainedModelId = Number(trainedModel);

    const inferenceValueRange = inferenceValue.split("-").map(Number);

    if (
      inferenceValueRange.length === 2 &&
      inferenceValueRange[0] < inferenceValueRange[1] &&
      trainedModelId > 0
    ) {
      filters.push(
        and(
          eq(taskInferences.modelId, trainedModelId),
          gte(taskInferences.inference, inferenceValueRange[0]),
          lte(taskInferences.inference, inferenceValueRange[1]),
        ),
      );
    }
  }

  // Dataset-based filters (train/test/valid/any/none)
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

  return { sl, filters };
}

export async function fetchTotalTasksForLabeling(
  queryParams: IFetchTasksForLabeling,
) {
  let sl = db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(tasks)
    .$dynamic();

  // Pass queryParams without 'after' to generateFiltersBasedOnQueryParams
  const { sl: newSl, filters } = generateFiltersBasedOnQueryParams(sl, {
    ...queryParams,
    after: undefined,
  });
  sl = newSl as typeof sl;

  const results = await sl.where(and(...filters));

  if (!results.length) {
    return 0;
  }

  return results[0].count;
}

export async function fetchTasksForLabeling(
  queryParams: IFetchTasksForLabeling,
) {
  let sl = db
    .select({
      id: tasks.id,
      name: tasks.name,
      imageUrl: tasks.imageUrl,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .$dynamic();

  const { sl: newSl, filters } = generateFiltersBasedOnQueryParams(
    sl,
    queryParams,
  );
  sl = newSl as typeof sl;

  return sl
    .where(and(...filters))
    .orderBy(asc(tasks.id))
    .limit(50);
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
