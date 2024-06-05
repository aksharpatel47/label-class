import * as context from "next/headers";
import { auth } from "@/lucia";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StatisticsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: {
    id: string;
  };
}) {
  const authRequest = auth.handleRequest("GET", context);
  const session = await authRequest.validate();

  if (!session) {
    redirect("/login");
  }

  const { id } = params;

  return (
    <>
      <div className="mt-4 mb-4 flex gap-4">
        <Link href={`/projects/${id}/statistics`} legacyBehavior passHref>
          <span className="underline cursor-pointer">Label Statistics</span>
        </Link>
        <Link
          href={`/projects/${id}/statistics/dataset`}
          legacyBehavior
          passHref
        >
          <span className="underline cursor-pointer">Dataset Statistics</span>
        </Link>
      </div>
      {children}
    </>
  );
}
