import { Button } from "@/components/ui/button";
import { auth } from "@/lucia";
import * as context from "next/headers";
import { redirect } from "next/navigation";
import NavLinks from "./nav-links";
import { SessionProvider } from "./session-context";

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
    <div className="flex flex-col ml-8 mr-8 mt-8">
      <div className="flex gap-4 mb-8 items-center justify-between">
        <div className="flex gap-4 items-center ">
          <NavLinks />
        </div>
        <div className="flex items-center gap-4">
          User: {session?.user?.name}
          <form action="/api/auth/logout" method="POST">
            <Button type="submit">Sign Out</Button>
          </form>
        </div>
      </div>

      <SessionProvider session={session}>{children}</SessionProvider>
    </div>
  );
}
