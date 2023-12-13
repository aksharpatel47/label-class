import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lucia";
import * as context from "next/headers";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authRequest = auth.handleRequest("GET", context);
  const session = await authRequest.validate();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col ml-64 mr-64 mt-16">
      <div className="flex gap-4 mb-8 items-center justify-between">
        <div className="flex gap-4 items-center">
          <Link href="/projects">Projects</Link>
          <Link href="/users">Users</Link>
          <Link href="/settings">Settings</Link>
        </div>
        <div className="flex items-center gap-8">
          {/* User: {session?.user?.name} */}
          <form action="/api/auth/logout" method="POST">
            <Button type="submit">Sign Out</Button>
          </form>
        </div>
      </div>

      {children}
    </div>
  );
}
