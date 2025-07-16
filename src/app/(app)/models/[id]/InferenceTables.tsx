import { InferenceTable } from "@/app/(app)/models/[id]/InferenceTable";
import { Button } from "@/components/ui/button";
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
import { User } from "lucia";
import { CopyToClipboard } from "./copy-to-clipboard-button";

export interface IIInferenceTablesProps {
  trainedModelId: number;
  selectedProjects: string[];
  labelName: string;
  user: User;
}

export async function InferenceTables({
  trainedModelId,
  selectedProjects,
  labelName,
  user,
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
      projectLabelId: projectLabels.id,
      label: taskLabels.value,
      dataset: projectTaskSelections.dataset,
      inference: sql`CASE WHEN task_inferences.inference >= 5000 THEN 'Present' ELSE 'Absent' END`,
      count: sql`COUNT(*)::integer`,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(projectLabels, eq(projects.id, projectLabels.projectId))
    .innerJoin(
      taskInferences,
      and(
        eq(tasks.name, taskInferences.imageName),
        eq(taskInferences.modelId, trainedModelId)
      )
    )
    .innerJoin(
      taskLabels,
      and(
        eq(tasks.id, taskLabels.taskId),
        eq(taskLabels.labelId, projectLabels.id)
      )
    )
    .innerJoin(
      projectTaskSelections,
      and(
        eq(tasks.id, projectTaskSelections.taskId),
        eq(projectTaskSelections.labelId, projectLabels.id)
      )
    )
    .where(
      and(
        inArray(tasks.projectId, selectedProjects),
        inArray(taskLabels.value, ["Present", "Absent"]),
        eq(projectLabels.labelName, labelName),
        eq(taskInferences.modelId, trainedModelId)
      )
    )
    .groupBy(
      projects.id,
      projects.name,
      projectLabels.id,
      taskLabels.value,
      projectTaskSelections.dataset,
      sql`CASE WHEN task_inferences.inference >= 5000 THEN 'Present' ELSE 'Absent' END`
    )
    .orderBy(projects.name);

  let inferenceTableData: any = {};

  // Always create total tables for each dataset
  ["train", "valid", "test"].forEach((dataset) => {
    const totalKey = `total-${dataset}`;
    inferenceTableData[totalKey] = {
      name: "Total" + " - " + dataset,
      tp: 0,
      fn: 0,
      fp: 0,
      tn: 0,
    };
  });

  // Create all project-dataset tables with zero values first
  selectedProjects.forEach((projectId) => {
    ["train", "valid", "test"].forEach((dataset) => {
      const key = `${projectId}-${dataset}`;
      if (!inferenceTableData[key]) {
        // Try to find projectName and projectLabelId from tasksWithInferenceAndLabel, fallback to empty string/null
        const found = tasksWithInferenceAndLabel.find(
          (t) => t.projectId === projectId
        );
        inferenceTableData[key] = {
          name: (found ? found.projectName : "") + " - " + dataset,
          tp: 0,
          tpLink: found
            ? `/projects/${projectId}/label?label=${found.projectLabelId}&labelvalue=Present&trainedmodel=${trainedModelId}&inferencevalue=>%3D50%25&dataset=${dataset}`
            : "",
          fn: 0,
          fnLink: found
            ? `/projects/${projectId}/label?label=${found.projectLabelId}&labelvalue=Present&trainedmodel=${trainedModelId}&inferencevalue=<50%25&dataset=${dataset}`
            : "",
          fp: 0,
          fpLink: found
            ? `/projects/${projectId}/label?label=${found.projectLabelId}&labelvalue=Absent&trainedmodel=${trainedModelId}&inferencevalue=>%3D50%25&dataset=${dataset}`
            : "",
          tn: 0,
          tnLink: found
            ? `/projects/${projectId}/label?label=${found.projectLabelId}&labelvalue=Absent&trainedmodel=${trainedModelId}&inferencevalue=<50%25&dataset=${dataset}`
            : "",
        };
      }
    });
  });

  // Now fill in actual values from tasksWithInferenceAndLabel
  tasksWithInferenceAndLabel.forEach((t) => {
    const totalKey = `total-${t.dataset}`;
    const key = `${t.projectId}-${t.dataset}`;

    // If not present, it was already created above
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
    <div className="flex flex-col gap-4">
      {user.role === "ADMIN" && (
        <div className="flex gap-2 mb-2">
          <Button asChild>
            <a
              href={`/api/models/${trainedModelId}/labels/${labelName}/potential-positives?${selectedProjects.map((id) => `selectedProject=${encodeURIComponent(id)}`).join("&")}`}
            >
              Download Potential Positives CSV
            </a>
          </Button>
          <Button asChild>
            <a
              href={`/api/models/${trainedModelId}/labels/${labelName}/inference-tables-excel?${selectedProjects.map((id) => `selectedProject=${encodeURIComponent(id)}`).join("&")}`}
              download
            >
              Download Inference Tables Excel
            </a>
          </Button>
          <CopyToClipboard
            inferenceTableData={inferenceTableData}
            keysWithSequence={keysWithSequence}
          />
        </div>
      )}
      {keysWithSequence.map((key) => (
        <div key={key}>
          <InferenceTable
            key={key}
            title={inferenceTableData[key].name}
            tp={inferenceTableData[key].tp}
            tpLink={inferenceTableData[key].tpLink}
            fn={inferenceTableData[key].fn}
            fnLink={inferenceTableData[key].fnLink}
            fp={inferenceTableData[key].fp}
            fpLink={inferenceTableData[key].fpLink}
            tn={inferenceTableData[key].tn}
            tnLink={inferenceTableData[key].tnLink}
          />
          <Separator className="mt-8 mb-8" />
        </div>
      ))}
    </div>
  );
}
