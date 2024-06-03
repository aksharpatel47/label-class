import { fetchTrainedModels } from "@/lib/data/inferences";
import { H1 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight } from "lucide-react";

export default async function Page() {
  const models = await fetchTrainedModels();

  return (
    <>
      <div className="flex justify-between mb-8">
        <H1>Models</H1>
      </div>
      <div className="flex mb-8">
        <Button>
          <Link href="/models/new">+ New Model</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model Name</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((m) => {
            return (
              <>
                <TableRow key={m.id}>
                  <TableCell>
                    <Link href={`/models/${m.id}`}>{m.name}</Link>
                  </TableCell>
                  <TableCell className="flex justify-end">
                    <ChevronRight />
                  </TableCell>
                </TableRow>
              </>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
