import { InferenceStatisticsForm } from "@/app/(app)/projects/[id]/statistics/inference/form";
import { fetchTrainedModels } from "@/lib/data/inferences";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import {
  Dataset,
  projectTaskSelections,
  taskInferences,
  taskLabels,
  tasks,
} from "@/db/schema";
import { fetchProjectLabels } from "@/lib/data/labels";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { unstable_noStore } from "next/cache";

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { trainedModelId?: string; label?: string; dataset?: Dataset };
}) {
  unstable_noStore();

  const trainedModels = await fetchTrainedModels();
  const projectLabels = await fetchProjectLabels(params.id);

  let statsNode: React.ReactNode | undefined;

  if (
    !!searchParams?.trainedModelId &&
    !!searchParams.label &&
    !!searchParams.dataset
  ) {
    const datasetTasks = await db
      .select({
        name: tasks.name,
        labelValue: taskLabels.value,
      })
      .from(projectTaskSelections)
      .innerJoin(tasks, eq(tasks.id, projectTaskSelections.taskId))
      .innerJoin(taskLabels, eq(tasks.id, taskLabels.taskId))
      .where(
        and(
          eq(tasks.projectId, params.id),
          eq(projectTaskSelections.dataset, searchParams.dataset as any),
          eq(projectTaskSelections.labelId, searchParams.label),
          eq(taskLabels.labelId, searchParams.label),
        ),
      );

    const allInferences = await db
      .select({
        name: tasks.name,
        inference: taskInferences.inference,
      })
      .from(taskInferences)
      .innerJoin(tasks, eq(tasks.id, taskInferences.taskId))
      .where(
        and(
          eq(tasks.projectId, params.id),
          eq(taskInferences.modelId, Number(searchParams.trainedModelId)),
        ),
      );

    const allInferenceMap = allInferences.reduce(
      function (acc, val) {
        acc[val.name] = val.inference;
        return acc;
      },
      {} as { [key: string]: number },
    );

    const stats = {
      tp: 0,
      tn: 0,
      fp: 0,
      fn: 0,
    };

    for (const datasetTask of datasetTasks) {
      const baseLabel = datasetTask.labelValue;
      const prediction = allInferenceMap[datasetTask.name];
      const predictionLabel = prediction >= 50 ? "Present" : "Absent";

      if (baseLabel == "Present" && predictionLabel == "Present") {
        stats["tp"] += 1;
      } else if (baseLabel == "Present" && predictionLabel == "Absent") {
        stats["fn"] += 1;
      } else if (baseLabel == "Absent" && predictionLabel == "Absent") {
        stats["tn"] += 1;
      } else if (baseLabel == "Absent" && predictionLabel == "Present") {
        stats["fp"] += 1;
      }
    }

    statsNode = (
      <Table className="mt-8">
        <TableCaption>
          Inference Statistics for{" "}
          {
            trainedModels.filter(
              (t) => t.id === Number(searchParams.trainedModelId),
            )[0].name
          }{" "}
          for dataset {searchParams.dataset}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Actual Present</TableHead>
            <TableHead>Actual Absent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Predicted Present</TableCell>
            <TableCell>{stats["tp"]}</TableCell>
            <TableCell>{stats["fp"]}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Predicted Absent</TableCell>
            <TableCell>{stats["fn"]}</TableCell>
            <TableCell>{stats["tn"]}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }
  return (
    <>
      <InferenceStatisticsForm
        trainedModels={trainedModels}
        projectLabels={projectLabels}
      />
      {statsNode}
    </>
  );
}
