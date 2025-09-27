import { authUser, userSession, UserSession } from "@/db/schema";
import { generateRandomString } from "./crypto";
import { insertUserSession } from "./db";
import { Cookie, createSessionCookie } from "./cookie";
import { DEFAULT_SESSION_COOKIE_NAME } from "lucia";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { isWithinExpiration } from "./date";

const activePeriodDefault = 1000 * 60 * 60 * 24; // 1 day
const idlePeriodDefault = 1000 * 60 * 60 * 24 * 14; // 14 days

async function getNewSessionExpiration() {
  const activePeriodExpiresAt = new Date(
    new Date().getTime() + activePeriodDefault
  );
  const idlePeriodExpiresAt = new Date(
    activePeriodExpiresAt.getTime() + idlePeriodDefault
  );
  return { activePeriodExpiresAt, idlePeriodExpiresAt };
}
export async function createSession(userId: string) {
  const sessionId = generateRandomString(40);
  const { activePeriodExpiresAt, idlePeriodExpiresAt } =
    await getNewSessionExpiration();

  return await insertUserSession(
    userId,
    sessionId,
    activePeriodExpiresAt,
    idlePeriodExpiresAt
  );
}

export function setSessionCookie(
  cookie: Cookie,
  context: typeof import("next/headers")
) {
  context.cookies().set(cookie.name, cookie.value, cookie.attributes);
}

export function getSessionCookie(context: typeof import("next/headers")) {
  return context.cookies().get(DEFAULT_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function validateSession(sessionId: string) {
  const dbSession = await db.query.userSession.findFirst({
    where: eq(userSession.id, sessionId),
  });
  if (!dbSession) return null;
  const dbUser = await db.query.authUser.findFirst({
    where: eq(authUser.id, dbSession.userId),
  });
  if (!dbUser) return null;
  const active = isWithinExpiration(dbSession.activeExpires);

  if (active) {
    return {
      session: dbSession,
      user: dbUser,
      fresh: false,
    };
  }

  const { activePeriodExpiresAt, idlePeriodExpiresAt } =
    await getNewSessionExpiration();

  const newDbSession = await db
    .update(userSession)
    .set({
      activeExpires: activePeriodExpiresAt.getTime(),
      idleExpires: idlePeriodExpiresAt.getTime(),
    })
    .where(eq(userSession.id, sessionId))
    .returning();

  return {
    session: newDbSession[0] as UserSession,
    user: dbUser,
    fresh: true,
  };
}
