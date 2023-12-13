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
  projectId: string;
  currentPage: number;
}) {
  const tasks = await fetchTasksInProject(props.projectId, props.currentPage);

  if (tasks.length === 0) {
    return (
      <div className="flex justify-center m-8">
        <p className="text-gray-500 text-2xl">No images to show</p>
      </div>
    );
  }

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
                new Set(task.taskLabels.map((l) => `${l.labelName}`))
              ).join(", ") || "No labels"}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
