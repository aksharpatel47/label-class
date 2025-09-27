import { db } from "@/db";
import { taskInferences, tasks } from "@/db/schema";
import { validateRequest } from "@/lib/auth/auth";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ taskId: string; modelId: string }> }
) {
  const params = await props.params;
  const session = await validateRequest();
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const { taskId, modelId } = params;

  const dbResult = await db
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

  if (dbResult.length === 0) {
    return NextResponse.json({ error: "No inference found" }, { status: 404 });
  }

  const response = {
    inference: dbResult[0].inference,
  };

  return NextResponse.json(response);
}
