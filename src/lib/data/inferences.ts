import { db } from "@/db";
import { asc, eq } from "drizzle-orm";
import { trainedModels } from "@/db/schema";

export function fetchTrainedModels(archived?: boolean) {
  const whereClause = !!archived
    ? undefined
    : eq(trainedModels.archived, false);
  return db.query.trainedModels.findMany({
    where: whereClause,
    orderBy: [asc(trainedModels.name)],
  });
}

export function fetchTrainedModelById(id: number) {
  return db.query.trainedModels.findFirst({
    where: eq(trainedModels.id, id),
  });
}
