import { redirectIfAuthenticated } from "@/app/lib/utils/session";
import { SignupForm } from "./form";

export default async function Page() {
  await redirectIfAuthenticated();

  return (
    <div className="flex justify-center">
      <SignupForm />
    </div>
  );
}
