import { db } from "@/db";
import { authUser } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function fetchUserById(id: string) {
  return db.query.authUser.findFirst({
    where: eq(authUser.id, id),
  });
}
export async function fetchUsers(){
  return db.query.authUser.findMany();
}
