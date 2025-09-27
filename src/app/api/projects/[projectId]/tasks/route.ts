import { validateRequest } from "@/lib/auth/auth";
import { fetchTasksInProject } from "@/lib/data/tasks";
import { NextRequest, NextResponse } from "next/server";
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const session = await validateRequest();

  if (!session) {
    return new Response(null, { status: 401 });
  }

  const { projectId } = params;

  const page = Number(request.nextUrl.searchParams.get("page")) || 1;

  const tasks = await fetchTasksInProject(projectId, page);

  return NextResponse.json(tasks);
}
