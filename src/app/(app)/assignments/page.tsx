import { H1, H2, H3 } from "@/components/ui/typography";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { db } from "@/db";
import {
  authUser,
  projectLabels,
  projects,
  taskAssignments,
  taskInferences,
  taskLabels,
  tasks,
} from "@/db/schema";
import { and, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { validateRequest } from "@/lib/auth/auth";

/**
 *
 * @param userId
 * @param modelId
 * @param labelName
 * @param leftInferenceValue
 * @param rightInferenceValue
 * @param limit
 * @param projectIds
 * @returns
 */
async function addAssignments(
  userId: string,
  modelId: number,
  labelName: string,
  leftInferenceValue: number,
  rightInferenceValue: number,
  limit: number,
  projectIds: string[],
) {
  // first select matching task ids
  const selected = await db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      labelId: projectLabels.id,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(
      projectLabels,
      and(
        eq(projects.id, projectLabels.projectId),
        eq(projectLabels.labelName, labelName),
      ),
    )
    .innerJoin(
      taskInferences,
      and(
        eq(tasks.name, taskInferences.imageName),
        eq(taskInferences.modelId, modelId),
        lte(taskInferences.inference, rightInferenceValue),
        gte(taskInferences.inference, leftInferenceValue),
      ),
    )
    .leftJoin(
      taskLabels,
      and(
        eq(taskLabels.taskId, tasks.id),
        eq(taskLabels.labelId, projectLabels.id),
      ),
    )
    .leftJoin(
      taskAssignments,
      and(
        eq(taskAssignments.taskId, tasks.id),
        eq(taskAssignments.labelId, projectLabels.id),
      ),
    )
    .where(
      and(
        inArray(projects.id, projectIds),
        isNull(taskAssignments.id),
        isNull(taskLabels.id),
      ),
    )
    .orderBy(projects.name)
    .limit(limit);

  if (selected.length === 0) {
    return [];
  }

  // then update those tasks by id
  return db
    .insert(taskAssignments)
    .values(
      selected.map((s) => ({
        taskId: s.id,
        userId,
        labelId: s.labelId,
      })),
    )
    .returning({ updatedId: tasks.id });
}

async function possibleTotalAssignments(
  modelId: number,
  labelName: string,
  leftInferenceValue: number,
  rightInferenceValue: number,
  projectIds: string[],
) {
  return db
    .select({
      count: sql<number>`count(${tasks.id})::integer`,
      projectId: tasks.projectId,
      labelId: projectLabels.id,
      projectName: projects.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(
      projectLabels,
      and(
        eq(projects.id, projectLabels.projectId),
        eq(projectLabels.labelName, labelName),
      ),
    )
    .innerJoin(
      taskInferences,
      and(
        eq(tasks.name, taskInferences.imageName),
        eq(taskInferences.modelId, modelId),
        lte(taskInferences.inference, rightInferenceValue),
        gte(taskInferences.inference, leftInferenceValue),
      ),
    )
    .leftJoin(
      taskLabels,
      and(
        eq(taskLabels.taskId, tasks.id),
        eq(taskLabels.labelId, projectLabels.id),
      ),
    )
    .leftJoin(
      taskAssignments,
      and(
        eq(taskAssignments.taskId, tasks.id),
        eq(taskAssignments.labelId, projectLabels.id),
      ),
    )
    .where(
      and(
        inArray(projects.id, projectIds),
        isNull(taskAssignments.id),
        isNull(taskLabels.id),
      ),
    )
    .orderBy(projects.name)
    .groupBy(tasks.projectId, projectLabels.id, projects.name);
}

async function fetchCurrentAssignments() {
  return db
    .select({
      count: sql<number>`count(${taskAssignments.id})::integer`,
      countOfTaskLabelsNotNull: sql<number>`count(${taskLabels.id})::integer`,
      userId: taskAssignments.userId,
      userName: authUser.name,
      projectLabelId: taskAssignments.labelId,
      projectLabelName: projectLabels.labelName,
      projectId: projects.id,
      projectName: projects.name,
    })
    .from(taskAssignments)
    .innerJoin(projectLabels, eq(taskAssignments.labelId, projectLabels.id))
    .innerJoin(projects, eq(projectLabels.projectId, projects.id))
    .innerJoin(authUser, eq(taskAssignments.userId, authUser.id))
    .leftJoin(
      taskLabels,
      and(
        eq(taskLabels.taskId, taskAssignments.taskId),
        eq(taskLabels.labelId, taskAssignments.labelId),
      ),
    )
    .orderBy(projectLabels.labelName, authUser.name)
    .groupBy(
      taskAssignments.userId,
      authUser.name,
      taskAssignments.labelId,
      projectLabels.labelName,
      projects.id,
      projects.name,
    );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    userId?: string;
    modelId?: string;
    labelName?: string;
    leftInferenceValue?: string;
    rightInferenceValue?: string;
    selectedProject?: string | string[];
    limit?: string;
    operation?: "add" | "fetch";
  }>;
}) {
  // Parent layout already validates authentication
  const {
    userId,
    modelId,
    labelName,
    leftInferenceValue,
    rightInferenceValue,
    limit,
    operation,
    selectedProject,
  } = await searchParams;

  const projectIds = selectedProject
    ? selectedProject instanceof Array
      ? selectedProject
      : [selectedProject]
    : await db.query.projects
        .findMany()
        .then((projects) => projects.map((p) => p.id));

  if (
    operation === "add" &&
    userId &&
    modelId &&
    labelName &&
    leftInferenceValue &&
    rightInferenceValue &&
    limit
  ) {
    const user = await db.query.authUser.findFirst({
      where: eq(authUser.id, userId),
    });

    const modelIdNum = parseInt(modelId, 10);
    const leftInferenceValueNum = parseInt(leftInferenceValue, 10);
    const rightInferenceValueNum = parseInt(rightInferenceValue, 10);
    const limitNum = parseInt(limit, 10);

    const assignments = await addAssignments(
      userId,
      modelIdNum,
      labelName,
      leftInferenceValueNum,
      rightInferenceValueNum,
      limitNum,
      projectIds,
    );

    return (
      <div className="p-4">
        <H1>Assignments Added</H1>
        <div>
          Added {assignments.length} assignments to user {user?.name || "N/A"}.
        </div>
      </div>
    );
  } else if (
    operation === "fetch" &&
    modelId &&
    labelName &&
    leftInferenceValue &&
    rightInferenceValue
  ) {
    const modelIdNum = parseInt(modelId, 10);
    const leftInferenceValueNum = parseInt(leftInferenceValue, 10);
    const rightInferenceValueNum = parseInt(rightInferenceValue, 10);

    const result = await possibleTotalAssignments(
      modelIdNum,
      labelName,
      leftInferenceValueNum,
      rightInferenceValueNum,
      projectIds,
    );

    const totalRemaining = result.reduce(
      (acc, curr) => acc + Number(curr.count || 0),
      0,
    );

    return (
      <div className="p-4">
        <H1>Possible Total Assignments</H1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Label Name</TableHead>
              <TableHead>Probability Greater Than</TableHead>
              <TableHead>Probability Less Than</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Done</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.map((r) => (
              <TableRow key={r.projectId}>
                <TableCell>{r.projectName}</TableCell>
                <TableCell>{labelName}</TableCell>
                <TableCell>{leftInferenceValueNum}</TableCell>
                <TableCell>{rightInferenceValueNum}</TableCell>
                <TableCell>{Number(r.count || 0).toLocaleString()}</TableCell>
                <TableCell>
                  <Link
                    href={`/projects/${r.projectId}/label?label=${r.labelId}&labelvalue=Unlabeled&trainedmodel=${modelId}&leftInferenceValue=${leftInferenceValue}&rightInferenceValue=${rightInferenceValue}`}
                    target="_blank"
                  >
                    View Project
                  </Link>
                </TableCell>
                <TableCell>
                  {Number(r.count || 0) === 0 ? (
                    <CircleCheck className="text-green-600" size={16} />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Totals</TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell>{totalRemaining.toLocaleString()}</TableCell>
              <TableCell />
              <TableCell>
                {totalRemaining === 0 ? (
                  <CircleCheck className="text-green-600" size={16} />
                ) : null}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    );
  }

  const currentAssignments = await fetchCurrentAssignments();

  // Get session user for filtering
  const session = await validateRequest();
  const sessionUserId = session?.userId;
  const ADMIN_USER_ID = "jwdwb06toekzjna";
  const isAdmin = sessionUserId === ADMIN_USER_ID;

  // Filter assignments based on user role
  const filteredAssignments = currentAssignments.filter((assignment) => {
    if (isAdmin) {
      return true; // Admin sees all assignments
    }
    return assignment.projectLabelName === "Buffer"; // Non-admin only sees "Buffer" label
  });

  if (filteredAssignments.length > 0) {
    const compiledData: Map<
      string,
      Map<string, Awaited<ReturnType<typeof fetchCurrentAssignments>>>
    > = new Map();

    filteredAssignments.forEach((assignment) => {
      const labelName = assignment.projectLabelName;
      if (!compiledData.has(labelName)) {
        compiledData.set(labelName, new Map());
      }
      const projectLabelMap = compiledData.get(labelName)!;
      const userName = assignment.userName;
      if (!projectLabelMap.has(userName)) {
        projectLabelMap.set(userName, [] as any[]);
      }
      projectLabelMap.get(userName)!.push(assignment);
    });

    return (
      <div className="p-4">
        <H1>Current Assignments</H1>
        {Array.from(compiledData.entries()).map(([labelName, userMap]) => (
          <div key={labelName} className="mt-8">
            <H2>{labelName}</H2>
            {Array.from(userMap.entries()).map(([userName, assignments]) => {
              const totalAssigned = assignments.reduce(
                (acc, a) => acc + Number(a.count || 0),
                0,
              );
              const totalCompleted = assignments.reduce(
                (acc, a) => acc + Number(a.countOfTaskLabelsNotNull || 0),
                0,
              );
              const totalRemaining = totalAssigned - totalCompleted;

              return (
                <div key={userName}>
                  <H3>{userName}</H3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Total Assigned</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Link To Label</TableHead>
                        {isAdmin && <TableHead>Link To Review</TableHead>}
                        <TableHead>Done</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow
                          key={`${assignment.userId}-${assignment.projectLabelId}-${assignment.projectId}`}
                        >
                          <TableCell>{assignment.projectName}</TableCell>
                          <TableCell>
                            {Number(assignment.count || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {Number(
                              assignment.countOfTaskLabelsNotNull || 0,
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {(
                              Number(assignment.count || 0) -
                              Number(assignment.countOfTaskLabelsNotNull || 0)
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/projects/${assignment.projectId}/label?label=${assignment.projectLabelId}&labelvalue=Unlabeled&assignedUser=${assignment.userId}`}
                              target="_blank"
                            >
                              View Assignments
                            </Link>
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <Link
                                href={`/projects/${assignment.projectId}/assigned-selection?labelId=${assignment.projectLabelId}&userId=${assignment.userId}`}
                                target="_blank"
                              >
                                Review Assignments
                              </Link>
                            </TableCell>
                          )}
                          <TableCell>
                            {Number(assignment.count || 0) -
                              Number(
                                assignment.countOfTaskLabelsNotNull || 0,
                              ) ===
                            0 ? (
                              <CircleCheck
                                className="text-green-600"
                                size={16}
                              />
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-medium">Totals</TableCell>
                        <TableCell>{totalAssigned.toLocaleString()}</TableCell>
                        <TableCell>{totalCompleted.toLocaleString()}</TableCell>
                        <TableCell>{totalRemaining.toLocaleString()}</TableCell>
                        <TableCell />
                        {isAdmin && <TableCell />}
                        <TableCell>
                          {totalRemaining === 0 ? (
                            <CircleCheck className="text-green-600" size={16} />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <H1>Assignments</H1>
      <div>
        Please provide the necessary query parameters to add or fetch
        assignments.
      </div>
    </div>
  );
}
