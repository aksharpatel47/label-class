import { db } from "@/db";
import { eq } from "drizzle-orm";
import { trainedModels } from "@/db/schema";

export function fetchTrainedModels() {
  return db.query.trainedModels.findMany();
}

export function fetchTrainedModelById(id: number) {
  return db.query.trainedModels.findFirst({
    where: eq(trainedModels.id, id),
  });
}
