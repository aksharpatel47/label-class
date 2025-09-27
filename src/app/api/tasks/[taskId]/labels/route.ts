import { db } from "@/db";
import { taskLabels } from "@/db/schema";
import { validateRequest } from "@/lib/auth/auth";
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
  props: { params: Promise<{ taskId: string }> }
) {
  const params = await props.params;
  const session = await validateRequest();

  if (!session) {
    return new Response(null, { status: 401 });
  }

  const results = await getResultsFromDb(params.taskId);

  return NextResponse.json(results);
}
