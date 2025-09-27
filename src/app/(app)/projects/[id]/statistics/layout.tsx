import { redirect } from "next/navigation";
import Link from "next/link";
import { validateRequest } from "@/lib/auth/auth";

export default async function StatisticsLayout(props: {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}) {
  const params = await props.params;

  const { children } = props;

  const session = await validateRequest();

  if (!session) {
    redirect("/login");
  }

  const { id } = params;

  return (
    <>
      <div className="mt-4 mb-4 flex gap-4">
        <Link href={`/projects/${id}/statistics`}>
          <span className="underline cursor-pointer">Label Statistics</span>
        </Link>
        <Link href={`/projects/${id}/statistics/dataset`}>
          <span className="underline cursor-pointer">Dataset Statistics</span>
        </Link>
      </div>
      {children}
    </>
  );
}
