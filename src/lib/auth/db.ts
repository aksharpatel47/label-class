import { db } from "@/db";
import { authUser, AuthUser, userKey, userSession } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserWithKey(email: string) {
  return await db.query.userKey.findFirst({
    where: eq(userKey.id, `username:${email.toLowerCase()}`),
  });
}

export async function insertUserSession(
  userId: string,
  sessionId: string,
  activePeriodExpiresAt: Date,
  idlePeriodExpiresAt: Date
) {
  const result = await db
    .insert(userSession)
    .values({
      id: sessionId,
      userId,
      activeExpires: activePeriodExpiresAt.getTime(),
      idleExpires: idlePeriodExpiresAt.getTime(),
    })
    .returning();

  if (result.length === 0) {
    throw new Error("Failed to create session");
  }
  return result[0];
}

export async function insertDatabaseUser(databaseUser: AuthUser) {
  const result = await db.insert(authUser).values(databaseUser).returning();
  if (result.length === 0) {
    throw new Error("Failed to create user");
  }
  return result[0];
}
