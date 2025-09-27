import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/db";
import {
  projectLabels,
  projects,
  projectTaskSelections,
  taskInferences,
  taskLabels,
  tasks,
} from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ modelId: string; labelName: string }> }
) {
  const params = await props.params;
  const { modelId, labelName } = params;
  const url = new URL(req.url);
  const selectedProjects = url.searchParams.getAll("selectedProject");

  if (!selectedProjects.length || !labelName || !modelId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
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
        eq(taskInferences.modelId, Number(modelId))
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
        eq(taskInferences.modelId, Number(modelId))
      )
    )
    .groupBy(
      projects.id,
      projects.name,
      projectLabels.id,
      taskLabels.value,
      projectTaskSelections.dataset,
      sql`CASE WHEN task_inferences.inference >= 5000 THEN 'Present' ELSE 'Absent' END`
    );

  let inferenceTableData: any = {};

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

  tasksWithInferenceAndLabel.forEach((t) => {
    const totalKey = `total-${t.dataset}`;
    const key = `${t.projectId}-${t.dataset}`;

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

  let keysWithSequence = [
    ...["train", "valid", "test"].map((d) => `total-${d}`),
    ...selectedProjects.flatMap((projectId) =>
      ["train", "valid", "test"]
        .map((dataset) => {
          const key = `${projectId}-${dataset}`;
          return inferenceTableData[key] ? key : null;
        })
        .filter((x): x is string => typeof x === "string")
    ),
  ];

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Inference Tables");

  sheet.addRow([
    "Name",
    "TP",
    "FN",
    "FP",
    "TN",
    "Prevalence",
    "PPV/Precision",
    "SENS/Recall",
    "Specificity",
    "NPV",
    "F1",
    "Accuracy",
  ]);

  keysWithSequence.forEach((key) => {
    const d = inferenceTableData[key];
    if (!d) return;
    const total = d.tp + d.tn + d.fp + d.fn;
    const prevalence = total ? ((d.tp + d.fn) / total) * 100 : 0;
    const precision = d.tp + d.fp ? (d.tp / (d.tp + d.fp)) * 100 : 0;
    const recall = d.tp + d.fn ? (d.tp / (d.tp + d.fn)) * 100 : 0;
    const specificity = d.tn + d.fp ? (d.tn / (d.tn + d.fp)) * 100 : 0;
    const npv = d.tn + d.fn ? (d.tn / (d.tn + d.fn)) * 100 : 0;
    const f1 =
      2 * d.tp + d.fp + d.fn
        ? ((2 * d.tp) / (2 * d.tp + d.fp + d.fn)) * 100
        : 0;
    const accuracy = total ? ((d.tp + d.tn) / total) * 100 : 0;
    sheet.addRow([
      d.name,
      d.tp,
      d.fn,
      d.fp,
      d.tn,
      prevalence.toPrecision(4) + "%",
      precision.toPrecision(4) + "%",
      recall.toPrecision(4) + "%",
      specificity.toPrecision(4) + "%",
      npv.toPrecision(4) + "%",
      f1.toPrecision(4) + "%",
      accuracy.toPrecision(4) + "%",
    ]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=InferenceTables_${labelName}_${modelId}.xlsx`,
    },
  });
}
