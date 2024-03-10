import { redirectIfAuthenticated } from "@/app/lib/utils/session";
import { SignupForm } from "./form";
import { redirect } from "next/navigation";

export default async function Page() {
  await redirectIfAuthenticated();
  redirect("/login");

  return (
    <div className="flex justify-center">
      <SignupForm />
    </div>
  );
}
