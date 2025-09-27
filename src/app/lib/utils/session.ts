import { validateRequest } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export async function redirectIfAuthenticated() {
  const result = await validateRequest();
  if (result) {
    redirect("/projects");
  }
}

export async function redirectIfUnauthenticated() {
  const session = await validateRequest();
  if (!session) {
    redirect("/login");
  }
}
