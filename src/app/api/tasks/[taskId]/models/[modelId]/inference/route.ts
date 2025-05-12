import { getRouteSession } from "@/app/lib/utils/session";
import { db } from "@/db";
import { taskInferences, tasks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { parse } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string; modelId: string } }
) {
  const session = await getRouteSession(request.method);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const { taskId, modelId } = params;

  const result = await db
    .select({ inference: taskInferences.inference })
    .from(tasks)
    .innerJoin(
      taskInferences,
      and(
        eq(tasks.name, taskInferences.imageName),
        eq(taskInferences.modelId, parseInt(modelId))
      )
    )
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "No inference found" }, { status: 404 });
  }

  const response = {
    inference: result[0].inference,
  };

  return NextResponse.json(response);
}
