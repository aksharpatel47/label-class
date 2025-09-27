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
import { ArchiveButton } from "@/app/(app)/models/components/archive-button";

interface IPageSearchParams {
  archived?: "true" | "false";
}

export default async function Page(
  props: {
    searchParams: Promise<IPageSearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const archived = searchParams.archived === "true";
  const models = await fetchTrainedModels(archived);

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
      <div className="flex gap-2">
        <Button variant={archived ? "outline" : "default"}>
          <Link href="/models?archived=false">Active</Link>
        </Button>
        <Button variant={archived ? "default" : "outline"} className="mr-4">
          <Link href="/models?archived=true">Archived</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model Name</TableHead>
            <TableHead>Label Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Archived</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models
            .filter((m) => m.archived === archived)
            .map((m) => {
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link href={`/models/${m.id}`}>{m.name}</Link>
                  </TableCell>
                  <TableCell>{m.labelName}</TableCell>
                  <TableCell>
                    {m.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <ArchiveButton modelId={m.id} archived={m.archived} />
                  </TableCell>
                  <TableCell className="flex justify-end">
                    <ChevronRight />
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </>
  );
}
