import { InferenceTable } from "@/app/(app)/models/[id]/InferenceTable";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import {
  projectLabels,
  projects,
  projectTaskSelections,
  taskInferences,
  taskLabels,
  tasks,
} from "@/db/schema";
import { and, eq, gte, inArray, sql } from "drizzle-orm";

export interface IIInferenceTablesProps {
  trainedModelId: number;
  selectedProjects: string[];
  labelName: string;
}

export async function InferenceTables({
  trainedModelId,
  selectedProjects,
  labelName,
}: IIInferenceTablesProps) {
  if (!selectedProjects || !labelName || !trainedModelId) {
    return <div>No projects selected.</div>;
  }

  // check if selectedProjects is an array. If not, convert it to an array
  if (!Array.isArray(selectedProjects)) {
    selectedProjects = [selectedProjects];
  }

  const tasksWithInferenceAndLabel = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      label: taskLabels.value,
      dataset: projectTaskSelections.dataset,
      inference: sql`CASE WHEN task_inferences.inference >= 50 THEN 'Present' ELSE 'Absent' END`,
      count: sql`COUNT(*)::integer`,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(projectLabels, eq(projects.id, projectLabels.projectId))
    .innerJoin(
      taskInferences,
      and(
        eq(tasks.name, taskInferences.imageName),
        eq(taskInferences.modelId, trainedModelId),
      ),
    )
    .innerJoin(
      taskLabels,
      and(
        eq(tasks.id, taskLabels.taskId),
        eq(taskLabels.labelId, projectLabels.id),
      ),
    )
    .innerJoin(
      projectTaskSelections,
      and(
        eq(tasks.id, projectTaskSelections.taskId),
        eq(projectTaskSelections.labelId, projectLabels.id),
      ),
    )
    .where(
      and(
        inArray(tasks.projectId, selectedProjects),
        inArray(taskLabels.value, ["Present", "Absent"]),
        eq(projectLabels.labelName, labelName),
        eq(taskInferences.modelId, trainedModelId),
      ),
    )
    .groupBy(
      projects.id,
      projects.name,
      taskLabels.value,
      projectTaskSelections.dataset,
      sql`CASE WHEN task_inferences.inference >= 50 THEN 'Present' ELSE 'Absent' END`,
    );

  let inferenceTableData: any = {};

  tasksWithInferenceAndLabel.forEach((t) => {
    const totalKey = `total-${t.dataset}`;
    const key = `${t.projectId}-${t.dataset}`;

    if (!inferenceTableData[totalKey]) {
      inferenceTableData[totalKey] = {
        name: "Total" + " - " + t.dataset,
        tp: 0,
        fn: 0,
        fp: 0,
        tn: 0,
      };
    }

    if (!inferenceTableData[key]) {
      inferenceTableData[key] = {
        name: t.projectName + " - " + t.dataset,
        tp: 0,
        fn: 0,
        fp: 0,
        tn: 0,
      };
    }

    if (t.inference === "Present" && t.label === "Present") {
      inferenceTableData[key].tp = t.count;
      inferenceTableData[totalKey].tp += t.count;
    } else if (t.inference === "Absent" && t.label === "Present") {
      inferenceTableData[key].fn = t.count;
      inferenceTableData[totalKey].fn += t.count;
    } else if (t.inference === "Present" && t.label === "Absent") {
      inferenceTableData[key].fp = t.count;
      inferenceTableData[totalKey].fp += t.count;
    } else if (t.inference === "Absent" && t.label === "Absent") {
      inferenceTableData[key].tn = t.count;
      inferenceTableData[totalKey].tn += t.count;
    }
  });

  let keysWithSequence = selectedProjects.reduce((acc, projectId) => {
    ["train", "valid", "test"].forEach((dataset) => {
      const key = `${projectId}-${dataset}`;
      if (inferenceTableData[key]) {
        acc.push(`${projectId}-${dataset}`);
      }
    });

    return acc;
  }, [] as string[]);

  keysWithSequence = [
    ...["train", "valid", "test"].map((d) => `total-${d}`),
    ...keysWithSequence,
  ];

  return (
    <div className="flex flex-col">
      {keysWithSequence.map((key) => (
        <div key={key}>
          <InferenceTable
            key={key}
            title={inferenceTableData[key].name}
            tp={inferenceTableData[key].tp}
            fn={inferenceTableData[key].fn}
            fp={inferenceTableData[key].fp}
            tn={inferenceTableData[key].tn}
          />
          <Separator className="mt-8 mb-8" />
        </div>
      ))}
    </div>
  );
}
