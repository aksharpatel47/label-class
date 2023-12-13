import { auth } from "@/lucia";
import * as context from "next/headers";
import { redirect } from "next/navigation";

export async function getPageSession() {
  const authRequest = auth.handleRequest("GET", context);
  return await authRequest.validate();
}

export async function getRouteSession(method: string) {
  const authRequest = auth.handleRequest(method, context);
  return await authRequest.validate();
}

export async function redirectIfAuthenticated() {
  const session = await getPageSession();
  if (session) {
    redirect("/projects");
  }
}

export async function redirectIfUnauthenticated() {
  const session = await getPageSession();
  if (!session) {
    redirect("/login");
  }
}
