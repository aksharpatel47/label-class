import { db } from "@/db";
import {
  projectLabels,
  projectTaskSelections,
  taskLabels,
  tasks,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  unstable_noStore();
  const { searchParams } = new URL(req.url);
  const labelName = searchParams.get("labelName");
  const projectIds = searchParams.getAll("projectIds");

  if (!labelName || !projectIds.length) {
    return NextResponse.json(
      { error: "Missing labelName or projectIds" },
      { status: 400 }
    );
  }

  const data = await db
    .select({
      imageUrl: tasks.imageUrl,
      labelValue: taskLabels.value,
      dataset: projectTaskSelections.dataset,
    })
    .from(tasks)
    .innerJoin(taskLabels, eq(tasks.id, taskLabels.taskId))
    .innerJoin(
      projectTaskSelections,
      and(
        eq(tasks.id, projectTaskSelections.taskId),
        eq(projectTaskSelections.labelId, taskLabels.labelId)
      )
    )
    .innerJoin(projectLabels, eq(taskLabels.labelId, projectLabels.id))
    .where(
      and(
        eq(projectLabels.labelName, labelName),
        inArray(taskLabels.value, ["Present", "Absent"]),
        inArray(tasks.projectId, projectIds)
      )
    );

  const csvContent = data.map((row) => {
    try {
      const parsedUrl = new URL(row.imageUrl);
      const path = parsedUrl.pathname.slice(1);
      return `${path},${row.labelValue},${row.dataset}`;
    } catch {
      return `${row.imageUrl},${row.labelValue},${row.dataset}`;
    }
  });

  const csvHeader = "path,label,dataset";
  const csvData = [csvHeader, ...csvContent].join("\n");

  // Format the file name: lower case, spaces to underscores
  const safeLabelName = labelName.toLowerCase().replace(/\s+/g, "_");
  const fileName = `${safeLabelName}_dataset.csv`;

  return new Response(csvData, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=\"${fileName}\"`,
      "Cache-Control": "no-store",
    },
  });
}
