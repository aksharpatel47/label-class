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
import { Download } from "lucide-react";
import { CopyToClipboard } from "./copy-to-clipboard-button";
import { fetchProjectsWithIds } from "@/lib/data/projects";

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

  const projectsData = await fetchProjectsWithIds(selectedProjects);

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
    .orderBy(projects.sequence, projects.name);

  let inferenceTableData: any = {};

  // Always create total tables for each dataset
  ["train", "valid", "test"].forEach((dataset) => {
    const totalKey = `total-${dataset}`;
    const paramTuples = [
      ["label", labelName],
      ["trainedModelId", `${trainedModelId}`],
      ["dataset", dataset],
      ...selectedProjects.map((id) => ["selectedProjects", id]),
    ];
    inferenceTableData[totalKey] = {
      name: "Total" + " - " + dataset,
      tp: 0,
      tpLink:
        "/browse?" +
        new URLSearchParams([
          ...paramTuples,
          ["inferenceValue", ">=50%"],
          ["labelValue", "Present"],
        ]).toString(),
      fn: 0,
      fnLink:
        "/browse?" +
        new URLSearchParams([
          ...paramTuples,
          ["inferenceValue", "<50%"],
          ["labelValue", "Present"],
        ]).toString(),
      fp: 0,
      fpLink:
        "/browse?" +
        new URLSearchParams([
          ...paramTuples,
          ["labelValue", "Absent"],
          ["inferenceValue", ">=50%"],
        ]).toString(),
      tn: 0,
      tnLink:
        "/browse?" +
        new URLSearchParams([
          ...paramTuples,
          ["labelValue", "Absent"],
          ["inferenceValue", "<50%"],
        ]).toString(),
    };
  });

  // Create all project-dataset tables with zero values first
  selectedProjects.forEach((projectId) => {
    ["train", "valid", "test"].forEach((dataset) => {
      const key = `${projectId}-${dataset}`;
      if (!inferenceTableData[key]) {
        // Try to find projectName and projectLabelId from tasksWithInferenceAndLabel, fallback to empty string/null
        const foundProject = projectsData.find((t) => t.id === projectId);
        const foundProjectLabelId = foundProject?.projectLabels.find(
          (l) => l.labelName === labelName
        )?.id;
        inferenceTableData[key] = {
          name: (foundProject ? foundProject.name : "") + " - " + dataset,
          tp: 0,
          tpLink: foundProject
            ? `/projects/${projectId}/label?label=${foundProjectLabelId}&labelvalue=Present&trainedmodel=${trainedModelId}&inferencevalue=>%3D50%25&dataset=${dataset}`
            : "",
          fn: 0,
          fnLink: foundProject
            ? `/projects/${projectId}/label?label=${foundProjectLabelId}&labelvalue=Present&trainedmodel=${trainedModelId}&inferencevalue=<50%25&dataset=${dataset}`
            : "",
          fp: 0,
          fpLink: foundProject
            ? `/projects/${projectId}/label?label=${foundProjectLabelId}&labelvalue=Absent&trainedmodel=${trainedModelId}&inferencevalue=>%3D50%25&dataset=${dataset}`
            : "",
          tn: 0,
          tnLink: foundProject
            ? `/projects/${projectId}/label?label=${foundProjectLabelId}&labelvalue=Absent&trainedmodel=${trainedModelId}&inferencevalue=<50%25&dataset=${dataset}`
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

  let keysWithSequence = projectsData.reduce((acc, project) => {
    ["train", "valid", "test"].forEach((dataset) => {
      const key = `${project.id}-${dataset}`;
      if (inferenceTableData[key]) {
        acc.push(`${project.id}-${dataset}`);
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
              href={`/api/models/${trainedModelId}/labels/${labelName}/potential-positives?threshold=0.10&${selectedProjects.map((id) => `selectedProject=${encodeURIComponent(id)}`).join("&")}`}
            >
              <Download className="mr-2 h-4 w-4" />
              Potential Positives (0.10 to 1.00)
            </a>
          </Button>
          <Button asChild>
            <a
              href={`/api/models/${trainedModelId}/labels/${labelName}/potential-positives?threshold=0.50&${selectedProjects.map((id) => `selectedProject=${encodeURIComponent(id)}`).join("&")}`}
            >
              <Download className="mr-2 h-4 w-4" />
              Potential Positives (0.50 to 1.00)
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
