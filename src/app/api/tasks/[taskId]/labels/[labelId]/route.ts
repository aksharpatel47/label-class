import { db } from "@/db";
import { taskLabels, tasks } from "@/db/schema";
import { projectTaskSelections } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth/auth";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ taskId: string; labelId: string }> }
) {
  const params = await props.params;
  const session = await validateRequest();
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const { taskId, labelId } = params;
  const data = await request.json();

  // Check if this label is part of projectTaskSelections
  const selection = await db
    .select()
    .from(projectTaskSelections)
    .where(
      and(
        eq(projectTaskSelections.taskId, taskId),
        eq(projectTaskSelections.labelId, labelId)
      )
    );

  // If present in projectTaskSelections, only allow admin
  if (selection.length > 0 && session.user.role !== "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Forbidden: Image & Label is part of a dataset. Only an admin can update this label.",
      },
      { status: 403 }
    );
  }

  await db
    .insert(taskLabels)
    .values({
      taskId,
      labelId,
      labeledBy: session.user.id,
      value: data.value,
    })
    .onConflictDoUpdate({
      target: [taskLabels.taskId, taskLabels.labelId],
      set: {
        labelId,
        value: data.value,
        labelUpdatedBy: session.user.id,
        updatedAt: sql`now()`,
      },
    });

  await db
    .update(tasks)
    .set({ updatedAt: sql`now()` })
    .where(eq(tasks.id, taskId));

  return NextResponse.json({ inserted: true });
}

// using PATCH to set the value of `flag` in taskLabels
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ taskId: string; labelId: string }> }
) {
  const params = await props.params;
  const session = await validateRequest();
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const { taskId, labelId } = params;
  const data = await request.json();

  await db
    .update(taskLabels)
    .set({
      flag: data.flag,
    })
    .where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)));

  return NextResponse.json({ updated: true });
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ taskId: string; labelId: string }> }
) {
  const params = await props.params;
  const session = await validateRequest();
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const { taskId, labelId } = params;

  // Check if this label is part of projectTaskSelections
  const selection = await db
    .select()
    .from(projectTaskSelections)
    .where(
      and(
        eq(projectTaskSelections.taskId, taskId),
        eq(projectTaskSelections.labelId, labelId)
      )
    );

  // If present in projectTaskSelections, restrict deleting the project label.
  if (selection.length > 0) {
    return NextResponse.json(
      {
        error:
          "Forbidden: Image & Label is part of a dataset. Use 'Difficult' or 'Skip' labels instead to exclude from training.",
      },
      { status: 403 }
    );
  }

  await db
    .delete(taskLabels)
    .where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)));

  await db
    .update(tasks)
    .set({ updatedAt: sql`now()` })
    .where(eq(tasks.id, taskId));

  return NextResponse.json({ deleted: true });
}
