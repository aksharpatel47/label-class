import { getRouteSession } from "@/app/lib/utils/session";
import { fetchTasksForLabeling } from "@/lib/data/tasks";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const session = await getRouteSession(request.method);

  if (!session) {
    return new Response(null, { status: 401 });
  }

  const { projectId } = params;

  const { searchParams } = request.nextUrl;
  const after = searchParams.get("after");
  const labelId = searchParams.get("label");
  const labelValue = searchParams.get("labelvalue");
  const user = searchParams.get("user");

  const tasks = await fetchTasksForLabeling(
    session.user.id,
    projectId,
    after,
    user,
    labelId,
    labelValue
  );

  return NextResponse.json(tasks);
}
