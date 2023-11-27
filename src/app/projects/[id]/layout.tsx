import { Button } from "@/components/ui/button";
import { H1 } from "@/components/ui/typography";
import { fetchProjectById } from "@/lib/data/projects";
import Link from "next/link";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: {
    id: string;
  };
}) {
  const projectId = parseInt(params.id, 10);
  const project = await fetchProjectById(projectId);
  return (
    <>
      <H1>{project?.name}</H1>
      <div className="flex gap-2 mt-8 mb-8">
        <Link href={`/projects/${params.id}`}>Images</Link>
        <Link href={`/projects/${params.id}/import`}>Import</Link>
        <Link href={`/projects/${params.id}/label`}>Label</Link>
        <Link href={`/projects/${params.id}/review`}>Review</Link>
      </div>
      {children}
    </>
  );
}
