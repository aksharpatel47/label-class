import { getRouteSession } from "@/app/lib/utils/session";
import { db } from "@/db";
import { taskLabels, tasks } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string; labelId: string } }
) {
  const session = await getRouteSession(request.method);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const { taskId, labelId } = params;
  const data = await request.json();

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string; labelId: string } }
) {
  const session = await getRouteSession(request.method);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const { taskId, labelId } = params;

  await db
    .delete(taskLabels)
    .where(
      and(
        eq(taskLabels.taskId, taskId),
        eq(taskLabels.labelId, labelId),
        eq(taskLabels.labeledBy, session.user.id)
      )
    );

  await db
    .update(tasks)
    .set({ updatedAt: sql`now()` })
    .where(eq(tasks.id, taskId));

  return NextResponse.json({ deleted: true });
}
