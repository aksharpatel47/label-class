import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { H1 } from "@/components/ui/typography";
import { fetchProjects } from "@/lib/data/projects";
import Link from "next/link";

export default async function Page() {
  const projects = await fetchProjects();
  return (
    <>
      <div className="flex justify-between mb-8">
        <H1>Projects</H1>
      </div>
      <div className="flex mb-8">
        <Button>
          <Link href="/projects/new">+ New Project</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Image Count</TableHead>
            <TableHead>Labels</TableHead>
            <TableHead>Created By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <Link href={`/projects/${project.id}`}>{project.name}</Link>
              </TableCell>
              <TableCell>{"TODO"}</TableCell>
              <TableCell>
                {project.projectLabels.map((l) => l.labelName).join(", ")}
              </TableCell>
              <TableCell>{project.creator.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <br />
    </>
  );
}
