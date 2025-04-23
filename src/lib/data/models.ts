"use server";

import { db } from "@/db";
import { trainedModels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function archiveModel(modelId: number, archived: boolean) {
  await db
    .update(trainedModels)
    .set({
      archived,
    })
    .where(eq(trainedModels.id, modelId));

  revalidatePath("/models"); // Revalidate the models page
}
