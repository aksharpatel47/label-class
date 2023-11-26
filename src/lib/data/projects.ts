import { db } from "@/db";
import { labels, projectLabels, projects, users } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { unstable_noStore } from "next/cache";

type Project = typeof projects.$inferSelect;
type Label = typeof labels.$inferSelect;
type User = typeof users.$inferSelect;

export async function fetchProjects() {
  unstable_noStore();
  return db.query.projects.findMany({
    with: {
      creator: true,
      projectLabels: {
        with: {
          label: true,
        },
      },
    },
  });
}

export async function fetchProjectById(id: number) {
  unstable_noStore();
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
}
