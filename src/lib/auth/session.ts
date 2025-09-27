import { db } from "@/db";
import { userSession } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { Cookie } from "./cookie";
import { generateRandomString } from "./crypto";
import { isWithinExpiration } from "./date";
import { insertUserSession } from "./db";

const DEFAULT_SESSION_COOKIE_NAME = "auth_session";

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

export async function setSessionCookie(
  cookie: Cookie,
  context: typeof import("next/headers")
) {
  const cookieStore = await context.cookies();
  cookieStore.set(cookie.name, cookie.value, cookie.attributes);
}

export async function getSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(DEFAULT_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function validateSession(sessionId: string) {
  const dbSession = await db.query.userSession.findFirst({
    where: eq(userSession.id, sessionId),
    with: {
      user: true,
    },
  });
  if (!dbSession) return null;
  const active = isWithinExpiration(dbSession.activeExpires);

  if (active) {
    return {
      session: dbSession,
      fresh: false,
    };
  }

  const { activePeriodExpiresAt, idlePeriodExpiresAt } =
    await getNewSessionExpiration();

  await db
    .update(userSession)
    .set({
      activeExpires: activePeriodExpiresAt.getTime(),
      idleExpires: idlePeriodExpiresAt.getTime(),
    })
    .where(eq(userSession.id, sessionId));

  const newDbSession = await db.query.userSession.findFirst({
    where: eq(userSession.id, sessionId),
    with: {
      user: true,
    },
  });
  if (!newDbSession) return null;

  return {
    session: newDbSession,
    fresh: true,
  };
}
