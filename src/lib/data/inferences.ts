import { db } from "@/db";

export function fetchTrainedModels() {
  return db.query.trainedModels.findMany();
}
