import { getRouteSession } from "@/app/lib/utils/session";
import { db } from "@/db";
import { taskLabels } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const session = await getRouteSession(req.method);

  if (!session) {
    return new Response(null, { status: 401 });
  }

  const results = await db.query.taskLabels.findMany({
    where: and(
      eq(taskLabels.taskId, params.taskId),
      eq(taskLabels.labeledBy, session.user.id)
    ),
    with: {
      label: true,
    },
  });

  return NextResponse.json(results);
}
