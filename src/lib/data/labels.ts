import { db } from "@/db";
import { taskLabels } from "@/db/schema";

export async function addLabelToTask(
  taskId: number,
  labelNames: string[],
  userId: string
) {
  const values = labelNames.map((labelName) => ({
    taskId,
    labelName,
    labeledBy: userId,
  }));
  return db.insert(taskLabels).values(values).onConflictDoNothing();
}
