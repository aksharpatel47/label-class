import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_noStore } from "next/cache";

export async function fetchProjects() {
  unstable_noStore();
  return db.query.projects.findMany({
    with: {
      creator: true,
      projectLabels: {
        orderBy: (labels, { asc }) => [asc(labels.sequence)],
      },
    },
  });
}

export async function fetchProjectById(id: string) {
  unstable_noStore();
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
}
