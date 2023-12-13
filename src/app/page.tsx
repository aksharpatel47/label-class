import Link from "next/link";
import {
  redirectIfAuthenticated,
  redirectIfUnauthenticated,
} from "@/app/lib/utils/session";
import { redirect } from "next/dist/server/api-utils";

export default async function Home() {
  await redirectIfAuthenticated();
  await redirectIfUnauthenticated();

  return (
    <div>
      <Link href="/login">Login</Link>
      <Link href="/signup">Signup</Link>
    </div>
  );
}
