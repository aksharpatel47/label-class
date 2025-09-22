import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  projectLabels,
  projects,
  projectTaskSelections,
  taskInferences,
  taskLabels,
  tasks,
} from "@/db/schema";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { modelId: string; labelName: string } }
) {
  const { modelId, labelName } = params;
  const url = new URL(req.url);
  const selectedProjects = url.searchParams.getAll("selectedProject");

  if (!selectedProjects.length || !labelName || !modelId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Query for labeled images that are NOT in the dataset (no project_task_selections entry)
  const labeledTasksNotInDataset = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      projectLabelId: projectLabels.id,
      label: taskLabels.value,
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
    .leftJoin(
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
        eq(taskInferences.modelId, Number(modelId)),
        // Only include tasks that are NOT in the dataset (no project_task_selections entry)
        isNull(projectTaskSelections.id)
      )
    )
    .groupBy(
      projects.id,
      projects.name,
      projectLabels.id,
      taskLabels.value,
      sql`CASE WHEN task_inferences.inference >= 5000 THEN 'Present' ELSE 'Absent' END`
    )
    .orderBy(projects.name);

  // Build data structure for each project
  let projectData: Record<string, any> = {};

  // Initialize projects with zero counts
  selectedProjects.forEach((projectId) => {
    const projectInfo = labeledTasksNotInDataset.find(
      (t) => t.projectId === projectId
    );
    if (projectInfo) {
      projectData[projectId] = {
        name: projectInfo.projectName,
        tp: 0, // True Positive: inference=Present AND label=Present
        fn: 0, // False Negative: inference=Absent AND label=Present
        fp: 0, // False Positive: inference=Present AND label=Absent
        tn: 0, // True Negative: inference=Absent AND label=Absent
        total: 0, // Total will be calculated from individual counts
      };
    }
  });

  // Populate actual counts
  labeledTasksNotInDataset.forEach((t) => {
    if (!projectData[t.projectId]) {
      projectData[t.projectId] = {
        name: t.projectName,
        tp: 0,
        fn: 0,
        fp: 0,
        tn: 0,
        total: 0,
      };
    }

    if (t.inference === "Present" && t.label === "Present") {
      projectData[t.projectId].tp = t.count;
    } else if (t.inference === "Absent" && t.label === "Present") {
      projectData[t.projectId].fn = t.count;
    } else if (t.inference === "Present" && t.label === "Absent") {
      projectData[t.projectId].fp = t.count;
    } else if (t.inference === "Absent" && t.label === "Absent") {
      projectData[t.projectId].tn = t.count;
    }
  });

  // Calculate totals for each project
  Object.values(projectData).forEach((project: any) => {
    project.total = project.tp + project.fn + project.fp + project.tn;
  });

  // Calculate totals
  const totals = {
    name: "TOTAL",
    tp: 0,
    fn: 0,
    fp: 0,
    tn: 0,
    total: 0,
  };

  Object.values(projectData).forEach((project: any) => {
    totals.tp += project.tp;
    totals.fn += project.fn;
    totals.fp += project.fp;
    totals.tn += project.tn;
    totals.total += project.total;
  });

  // Create CSV content
  const csvHeader = [
    "Project",
    "True Positives",
    "False Negatives",
    "False Positives",
    "True Negatives",
    "Total",
    "Link",
  ];

  const csvRows = Object.entries(projectData).map(
    ([projectId, data]: [string, any]) => [
      data.name,
      data.tp,
      data.fn,
      data.fp,
      data.tn,
      data.total,
      `https://walkit-labels.aksharpatel47.com/projects/${projectId}/selection`,
    ]
  );

  // Add totals row
  const totalsRow = [
    totals.name,
    totals.tp,
    totals.fn,
    totals.fp,
    totals.tn,
    totals.total,
    "", // no link for totals
  ];

  const csvContent = [
    csvHeader.join(","),
    ...csvRows.map((row) => row.join(",")),
    totalsRow.join(","),
  ].join("\n");

  // Generate filename
  const fileName = `${labelName.toLowerCase().replace(/\s+/g, "_")}_dataset_candidates_model_${modelId}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
