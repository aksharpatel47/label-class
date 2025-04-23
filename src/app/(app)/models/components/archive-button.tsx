"use client";

import { archiveModel } from "@/lib/data/models";
import { Button } from "@/components/ui/button";

export function ArchiveButton({
  modelId,
  archived,
}: {
  modelId: number;
  archived: boolean;
}) {
  const handleArchive = () => {
    archiveModel(modelId, !archived);
  };

  return (
    <Button onClick={handleArchive} variant="outline">
      {archived ? "Unarchive" : "Archive"}
    </Button>
  );
}
