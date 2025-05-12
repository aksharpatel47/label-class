import { getRouteSession } from "@/app/lib/utils/session";
import { db } from "@/db";
import { taskLabels } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

async function getResultsFromDb(taskId: string) {
  return await db.query.taskLabels.findMany({
    where: and(eq(taskLabels.taskId, taskId)),
    with: {
      label: true,
      labeledBy: {
        columns: {
          id: true,
          name: true,
        },
      },
      labelUpdatedBy: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export type IGetTaskLabelReponse = Awaited<ReturnType<typeof getResultsFromDb>>;

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const session = await getRouteSession(req.method);

  if (!session) {
    return new Response(null, { status: 401 });
  }

  const results = await getResultsFromDb(params.taskId);

  return NextResponse.json(results);
}
