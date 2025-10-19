import {
  AssignedSelectionForm,
  IAssignedSelectionFormValues,
} from "@/app/(app)/projects/[id]/assigned-selection/form";
import { DatasetViewer } from "@/app/components/viewer";
import { db } from "@/db";
import {
  projectTaskSelections,
  taskAssignments,
  taskLabels,
  tasks,
} from "@/db/schema";
import { fetchProjectWithLabels } from "@/lib/data/labels";
import { fetchUsers } from "@/lib/data/users";
import { eq, and, isNull, getTableColumns } from "drizzle-orm";

function getAssignedTasksWithLabelsNotInDataset(
  projectId: string,
  values: IAssignedSelectionFormValues
) {
  return db
    .select({ ...getTableColumns(tasks) })
    .from(tasks)
    .innerJoin(taskAssignments, eq(taskAssignments.taskId, tasks.id))
    .innerJoin(
      taskLabels,
      and(
        eq(taskLabels.taskId, tasks.id),
        eq(taskLabels.labelId, values.labelId)
      )
    )
    .leftJoin(
      projectTaskSelections,
      and(
        eq(projectTaskSelections.taskId, tasks.id),
        eq(projectTaskSelections.labelId, values.labelId)
      )
    )
    .where(
      and(
        eq(tasks.projectId, projectId),
        eq(taskAssignments.userId, values.userId),
        eq(taskAssignments.labelId, values.labelId),
        eq(taskLabels.value, values.labelValue),
        isNull(projectTaskSelections.id)
      )
    );
}

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<IAssignedSelectionFormValues>;
}) {
  const params = await props.params;
  const projectId = params.id;
  const searchParams = await props.searchParams;
  const projectWithLabels = await fetchProjectWithLabels(projectId);
  const users = await fetchUsers();

  const initialSearchParams: IAssignedSelectionFormValues = {
    labelId:
      searchParams.labelId || projectWithLabels?.projectLabels[0].id || "",
    userId: searchParams.userId || users[0]?.id || "",
    labelValue: searchParams.labelValue || "Present",
    dataset: searchParams.dataset || "split",
  };

  const assignedTasks = await getAssignedTasksWithLabelsNotInDataset(
    projectId,
    initialSearchParams
  );

  return (
    <div className="flex flex-col gap-2">
      <div>
        Use this page to select and assign images to users based on existing
        labels and criteria.
      </div>
      <AssignedSelectionForm
        projectLabels={projectWithLabels?.projectLabels}
        users={users}
        projectId={projectId}
        initialValues={initialSearchParams}
      />
      <DatasetViewer
        tasks={assignedTasks}
        projectsWithLabels={[projectWithLabels]}
      />
    </div>
  );
}
