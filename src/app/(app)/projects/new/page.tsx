import { getPageSession } from "@/app/lib/utils/session";
import { NewProjectForm } from "./form";

export default async function Page() {
  const session = await getPageSession();

  return (
    <div>
      <NewProjectForm userId={session!.user.id} />
    </div>
  );
}
