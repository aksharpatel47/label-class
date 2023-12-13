import { getRouteSession } from "@/app/lib/utils/session";
import { db } from "@/db";
import { projectLabels, taskLabels } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string; labelId: string } }
) {
  const session = await getRouteSession(request.method);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const { taskId, labelId } = params;

  const taskLabel = await db.query.taskLabels.findFirst({
    where: and(
      eq(taskLabels.taskId, taskId),
      eq(taskLabels.labelId, labelId),
      eq(taskLabels.labeledBy, session.user.id)
    ),
  });

  if (!!taskLabel) {
    await db.delete(taskLabels).where(eq(taskLabels.id, taskLabel.id));
    return NextResponse.json({ deleted: true });
  }
  await db.insert(taskLabels).values({
    taskId,
    labelId: labelId,
    labeledBy: session.user.id,
  });

  return NextResponse.json({ inserted: true });
}
