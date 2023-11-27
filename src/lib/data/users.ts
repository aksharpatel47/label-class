import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function fetchUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}
