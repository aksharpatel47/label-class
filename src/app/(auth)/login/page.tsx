import { auth } from "@/lucia";
import { LoginForm } from "./form";
import * as context from "next/headers";
import { redirect } from "next/navigation";
import { redirectIfAuthenticated } from "../../lib/utils/session";

export default async function Page() {
  await redirectIfAuthenticated();

  return (
    <div className="flex justify-center">
      <LoginForm />
    </div>
  );
}
