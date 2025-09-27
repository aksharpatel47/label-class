import { validateRequest } from "@/lib/auth/auth";
import { NewProjectForm } from "./form";

export default async function Page() {
  const session = await validateRequest();

  return (
    <div>
      <NewProjectForm userId={session!.user.id} />
    </div>
  );
}
