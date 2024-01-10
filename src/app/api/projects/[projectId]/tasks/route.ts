import { getRouteSession } from "@/app/lib/utils/session";
import { fetchTasksInProject } from "@/lib/data/tasks";
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

  const page = Number(request.nextUrl.searchParams.get("page")) || 1;
  const userFilter = request.nextUrl.searchParams.get("user") || "";

  const tasks = await fetchTasksInProject(projectId, page, userFilter);

  return NextResponse.json(tasks);
}
