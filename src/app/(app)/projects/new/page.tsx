import { validateRequest } from "@/lib/auth/auth";
import { NewProjectForm } from "./form";

export default async function Page() {
  const result = await validateRequest();

  return (
    <div>
      <NewProjectForm userId={result!.user.id} />
    </div>
  );
}
