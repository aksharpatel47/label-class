import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import NavLinks from "./nav-links";
import { SessionProvider } from "./session-context";
import { validateRequest } from "@/lib/auth/auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await validateRequest();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col ml-2 mr-2 mt-2">
      <div className="flex gap-4 mb-2 items-center justify-between">
        <div className="flex gap-4 items-center ">
          <NavLinks />
        </div>
        <div className="flex items-center gap-4">
          User: {session.user.name}
          <form action="/api/auth/logout" method="POST">
            <Button type="submit">Sign Out</Button>
          </form>
        </div>
      </div>

      <SessionProvider session={session}>{children}</SessionProvider>
    </div>
  );
}
