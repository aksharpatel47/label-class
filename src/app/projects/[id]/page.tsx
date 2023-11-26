import { Button } from "@/components/ui/button";
import { H1 } from "@/components/ui/typography";
import { fetchProjectById } from "@/lib/data/projects";
import Link from "next/link";

export default async function Page({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id, 10);
  const project = await fetchProjectById(projectId);
  return (
    <>
      <H1>Project {project?.name}</H1>
      <div className="flex gap-2 mt-8">
        <Button>
          <Link href={`/projects/${params.id}/label`}>Label</Link>
        </Button>
        <Button>
          <Link href={`/projects/${params.id}/review`}>Review</Link>
        </Button>
      </div>
    </>
  );
}
