import {
  AssignedSelectionForm,
  IAssignedSelectionInitialValues,
} from "@/app/(app)/projects/[id]/assigned-selection/form";
import { fetchProjectLabels } from "@/lib/data/labels";
import { fetchUsers } from "@/lib/data/users";

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<IAssignedSelectionInitialValues>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const projectLabels = await fetchProjectLabels(params.id);
  const users = await fetchUsers();

  return (
    <div className="flex flex-col gap-2">
      <div>
        Use this page to select and assign images to users based on existing
        labels and criteria.
      </div>
      <AssignedSelectionForm
        projectLabels={projectLabels}
        users={users}
        projectId={params.id}
        initialValues={searchParams}
      />
    </div>
  );
}
