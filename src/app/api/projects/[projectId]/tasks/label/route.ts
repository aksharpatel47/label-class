import { getRouteSession } from "@/app/lib/utils/session";
import {
  fetchTasksForLabeling,
  fetchTotalTasksForLabeling,
} from "@/lib/data/tasks";
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
  const labeledOn = searchParams.get("labeledon");
  const labeledBy = searchParams.get("user");
  const trainedModel = searchParams.get("trainedmodel");
  const inferenceValue = searchParams.get("inferencevalue");
  const dataset = searchParams.get("dataset");

  const input = {
    currentUserId: session.user.id,
    projectId,
    after,
    labeledBy,
    labeledOn,
    labelId,
    labelValue,
    trainedModel,
    inferenceValue,
    dataset,
  };

  const tasks = await fetchTasksForLabeling(input);
  const totalTasks = await fetchTotalTasksForLabeling(input);

  const response = {
    tasks,
    totalTasks,
  };
  return NextResponse.json(response);
}
