"use server";

import { db } from "@/db";
import { trainedModels } from "@/db/schema";
import { eq, Param } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";

export async function archiveModel(modelId: number, archived: boolean) {
  await db
    .update(trainedModels)
    .set({
      archived,
    })
    .where(eq(trainedModels.id, modelId));

  revalidatePath("/models"); // Revalidate the models page
}

/**
 * Returns the count of images with inference >= 5000 for a given project, label, and model,
 * and which do NOT have a task_label for that label.
 * Also returns present/absent label counts in train/valid/test datasets for that label.
 */
export async function fetchPotentialUnlabeledPositivesData(
  projectIds: string[],
  labelName: string,
  modelId: number
) {
  // Use a single CTE and conditional aggregation for all stats, grouped by project
  const res = await db.execute(sql`
      with relevant_tasks as (
        select t.id as task_id, t.name as image_name, pl.id as label_id, t.project_id
        from tasks t
        inner join project_labels pl on t.project_id = pl.project_id and pl.label_name = ${labelName}
        where t.project_id = ANY(${new Param(projectIds)})
      )
      select
        t.project_id,
        p.name as project_name,
        t.label_id,
        count(distinct case when ti.inference >= 5000 and tl.task_id is null then t.task_id end) as potential_positives,
        count(distinct case when pts.dataset = 'train' and tl.label_value = 'Present' then t.task_id end) as train_present,
        count(distinct case when pts.dataset = 'train' and tl.label_value = 'Absent' then t.task_id end) as train_absent,
        count(distinct case when pts.dataset = 'valid' and tl.label_value = 'Present' then t.task_id end) as valid_present,
        count(distinct case when pts.dataset = 'valid' and tl.label_value = 'Absent' then t.task_id end) as valid_absent,
        count(distinct case when pts.dataset = 'test' and tl.label_value = 'Present' then t.task_id end) as test_present,
        count(distinct case when pts.dataset = 'test' and tl.label_value = 'Absent' then t.task_id end) as test_absent
      from relevant_tasks t
      inner join projects p on t.project_id = p.id
      left join task_inferences ti on t.image_name = ti.image_name and ti.model_id = ${modelId}
      left join task_labels tl on t.task_id = tl.task_id and t.label_id = tl.label_id
      left join project_task_selections pts on t.task_id = pts.task_id and t.label_id = pts.label_id
      group by t.project_id, p.name, t.label_id
    `);

  // Return as an array of stats per project_id
  return res.map((row) => ({
    projectId: row.project_id,
    projectName: row.project_name,
    labelId: row.label_id,
    potentialPositives: Number(row.potential_positives || 0),
    trainPresent: Number(row.train_present || 0),
    trainAbsent: Number(row.train_absent || 0),
    validPresent: Number(row.valid_present || 0),
    validAbsent: Number(row.valid_absent || 0),
    testPresent: Number(row.test_present || 0),
    testAbsent: Number(row.test_absent || 0),
  }));
}
