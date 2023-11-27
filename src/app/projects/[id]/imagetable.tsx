import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchTasksInProject } from "@/lib/data/tasks";
import Image from "next/image";

export async function ImageTable(props: {
  projectId: number;
  currentPage: number;
}) {
  const tasks = await fetchTasksInProject(props.projectId, props.currentPage);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Image</TableHead>
          <TableHead>File Name</TableHead>
          <TableHead>Labels</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">
              <Image
                src={task.imageUrl}
                alt={task.name}
                height={50}
                width={50}
              />
            </TableCell>
            <TableCell>{task.name}</TableCell>
            <TableCell>
              {Array.from(
                new Set(task.taskLabels.map((l) => l.labelName))
              ).join(", ")}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
