import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unstable_noStore } from "next/cache";

export async function fetchUsers() {
  unstable_noStore();
  return db.query.users.findMany();
}

export async function fetchUserById(id: string) {
  unstable_noStore();
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}
