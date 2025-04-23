import { db } from "@/db";
import { asc, eq } from "drizzle-orm";
import { trainedModels } from "@/db/schema";
import { unstable_noStore } from "next/cache";

export function fetchTrainedModels(withArchived = true) {
  unstable_noStore();
  const whereClause = withArchived
    ? undefined
    : eq(trainedModels.archived, false);
  return db.query.trainedModels.findMany({
    where: whereClause,
    orderBy: [asc(trainedModels.name)],
  });
}

export function fetchTrainedModelById(id: number) {
  unstable_noStore();
  return db.query.trainedModels.findFirst({
    where: eq(trainedModels.id, id),
  });
}
