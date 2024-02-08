"use server";

import { z } from "zod";
import { sql } from "@/db";

const selectionSchema = z.object({
  numImages: z.coerce.number(),
  labelId: z.string(),
  inferenceModelId: z.coerce.number(),
});

interface IState {
  counts?: {
    totalImagesNeeded: number;
    falsePositiveCountGT75: number;
    falsePositiveCountLT75: number;
    falseNegativeCountGT25: number;
    falseNegativeCountLT25: number;
    truePositiveCountGT75: number;
    truePositiveCountLT75: number;
    trueNegativeCountGT25: number;
    trueNegativeCountLT25: number;
    neededPresentLabelCount: number;
    neededAbsentLabelCount: number;
  };
  error?: string;
}

export async function selectionAction(
  projectId: string,
  prevState: IState | undefined,
  formData: FormData,
): Promise<IState> {
  const result = selectionSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: "Invalid selection data" };
  }

  const { numImages, labelId, inferenceModelId } = result.data;
  console.log(
    `numImages: ${numImages}, labelId: ${labelId}, inferenceModelId: ${inferenceModelId}`,
  );

  // first get the number of images where the label does not match the inference model
  const falsePositiveCountGT75 = await sql<{ count: number }[]>`
        select count(*)::int
        from task_labels as tl
                 inner join public.tasks t on tl.task_id = t.id
                 inner join public.task_inferences ti on ti.task_id = t.id
                 inner join public.trained_models tm on tm.id = ti.model_id
        where tm.id = 1
          and ti.inference >= 75
          and tl.label_id = ${labelId}
          and tl.label_value = 'Absent';
    `.then((res) => res[0].count);

  const falsePositiveCountLT75 = await sql<{ count: number }[]>`
        select count(*)::int
        from task_labels as tl
                 inner join public.tasks t on tl.task_id = t.id
                 inner join public.task_inferences ti on ti.task_id = t.id
                 inner join public.trained_models tm on tm.id = ti.model_id
        where tm.id = 1
          and ti.inference >= 50
          and ti.inference < 75
          and tl.label_id = ${labelId}
          and tl.label_value = 'Absent';
    `.then((res) => res[0].count);

  const falseNegativeCountGT25 = await sql<{ count: number }[]>`
        select count(*)::int
        from task_labels as tl
                 inner join public.tasks t on tl.task_id = t.id
                 inner join public.task_inferences ti on ti.task_id = t.id
                 inner join public.trained_models tm on tm.id = ti.model_id
        where tm.id = 1
          and ti.inference >= 25
          and ti.inference < 50
          and tl.label_id = ${labelId}
          and tl.label_value = 'Present';
    `.then((res) => res[0].count);

  const falseNegativeCountLT25 = await sql<{ count: number }[]>`
        select count(*)::int
        from task_labels as tl
                 inner join public.tasks t on tl.task_id = t.id
                 inner join public.task_inferences ti on ti.task_id = t.id
                 inner join public.trained_models tm on tm.id = ti.model_id
        where tm.id = 1
          and ti.inference < 25
          and tl.label_id = ${labelId}
          and tl.label_value = 'Present';
    `.then((res) => res[0].count);

  const truePositiveCountGT75 = await sql<{ count: number }[]>`
        select count(*)::int
        from task_labels as tl
                 inner join public.tasks t on tl.task_id = t.id
                 inner join public.task_inferences ti on ti.task_id = t.id
                 inner join public.trained_models tm on tm.id = ti.model_id
        where tm.id = 1
          and ti.inference >= 75
          and tl.label_id = ${labelId}
          and tl.label_value = 'Present';
    `.then((res) => res[0].count);

  const truePositiveCountLT75 = await sql<{ count: number }[]>`
        select count(*)::int
        from task_labels as tl
                 inner join public.tasks t on tl.task_id = t.id
                 inner join public.task_inferences ti on ti.task_id = t.id
                 inner join public.trained_models tm on tm.id = ti.model_id
        where tm.id = 1
          and ti.inference >= 50
          and ti.inference < 75
          and tl.label_id = ${labelId}
          and tl.label_value = 'Present';
    `.then((res) => res[0].count);

  const trueNegativeCountGT25 = await sql<{ count: number }[]>`
        select count(*)::int
        from task_labels as tl
                 inner join public.tasks t on tl.task_id = t.id
                 inner join public.task_inferences ti on ti.task_id = t.id
                 inner join public.trained_models tm on tm.id = ti.model_id
        where tm.id = 1
          and ti.inference >= 25
          and ti.inference < 50
          and tl.label_id = ${labelId}
          and tl.label_value = 'Absent';
    `.then((res) => res[0].count);

  const trueNegativeCountLT25 = await sql<{ count: number }[]>`
            select count(*)::int
            from task_labels as tl
                     inner join public.tasks t on tl.task_id = t.id
                     inner join public.task_inferences ti on ti.task_id = t.id
                     inner join public.trained_models tm on tm.id = ti.model_id
            where tm.id = 1
            and ti.inference < 25
            and tl.label_id = ${labelId}
            and tl.label_value = 'Absent';
        `.then((res) => res[0].count);

  const eachLabelCount = numImages / 2;

  let selectedPresentLabelCount =
    falseNegativeCountGT25 +
    falseNegativeCountLT25 +
    truePositiveCountGT75 +
    truePositiveCountLT75;

  let neededPresentLabelCount = Math.max(
    eachLabelCount - selectedPresentLabelCount,
    0,
  );

  const selectedAbsentLabelCount =
    falsePositiveCountGT75 +
    falsePositiveCountLT75 +
    trueNegativeCountGT25 +
    trueNegativeCountLT25;

  let neededAbsentLabelCount = Math.max(
    eachLabelCount - selectedAbsentLabelCount,
    0,
  );

  return {
    counts: {
      totalImagesNeeded: numImages,
      falsePositiveCountGT75,
      falsePositiveCountLT75,
      falseNegativeCountGT25,
      falseNegativeCountLT25,
      truePositiveCountGT75,
      truePositiveCountLT75,
      trueNegativeCountGT25,
      trueNegativeCountLT25,
      neededPresentLabelCount,
      neededAbsentLabelCount,
    },
  };
}
