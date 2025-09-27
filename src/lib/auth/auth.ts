import { db } from "@/db";
import {
  authUser,
  AuthUser,
  AuthUserRole,
  userKey,
  UserKey,
  userSession,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import * as context from "next/headers";
import { cookies } from "next/headers";
import { createSessionCookie, DEFAULT_SESSION_COOKIE_NAME } from "./cookie";
import { generateRandomString, generateScryptHash } from "./crypto";
import { getSessionCookie, setSessionCookie, validateSession } from "./session";

export async function createUser(options: {
  key: {
    providerId: string;
    providerUserId: string;
    password: string;
  };
  attributes: {
    name: string;
    role: AuthUserRole;
  };
}) {
  const userId = generateRandomString(15);
  const authUserData = {
    ...options.attributes,
    id: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } satisfies AuthUser;

  const hashedPassword = await generateScryptHash(options.key.password);

  const userKeyData = {
    id: `${options.key.providerId}:${options.key.providerUserId}`,
    userId,
    hashedPassword,
  } satisfies UserKey;

  await db.insert(userKey).values(userKeyData);
  await db.insert(authUser).values(authUserData);

  return authUserData;
}

export type ValidateRequestResult = Awaited<ReturnType<typeof validateRequest>>;

export async function validateRequest() {
  const sessionId = await getSessionCookie();
  if (!sessionId) return null;
  const result = await validateSession(sessionId);
  if (!result) return null;
  const { session, fresh } = result;
  if (fresh) {
    const newCookie = createSessionCookie(session, { cookie: {} });
    setSessionCookie(newCookie, context);
  }
  return session;
}

export async function login() {}

export async function logout() {
  const sessionId = await getSessionCookie();
  if (!sessionId) return;
  const dbSession = await db.query.userSession.findFirst({
    where: eq(userSession.id, sessionId),
  });
  if (!dbSession) return;
  await db.delete(userSession).where(eq(userSession.id, sessionId));
  const cookieStore = await cookies();
  cookieStore.delete(DEFAULT_SESSION_COOKIE_NAME);
}

export async function updatePassword(userId: string, newPassword: string) {
  const userKeyResult = await db.query.userKey.findFirst({
    where: eq(userKey.userId, userId),
  });
  if (!userKeyResult) throw new Error("No keys found for this user");

  const newHashedPassword = await generateScryptHash(newPassword);

  await db
    .update(userKey)
    .set({ hashedPassword: newHashedPassword })
    .where(eq(userKey.id, userKeyResult.id));
}
