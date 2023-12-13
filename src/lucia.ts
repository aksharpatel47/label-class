import { lucia } from "lucia";
import { nextjs_future } from "lucia/middleware";
import { postgres as postgresAdapter } from "@lucia-auth/adapter-postgresql";
import { sql } from "@/db";

export const auth = lucia({
  env: process.env.NODE_ENV === "production" ? "PROD" : "DEV",
  middleware: nextjs_future(),
  sessionCookie: {
    expires: false,
  },
  adapter: postgresAdapter(sql, {
    user: "auth_user",
    key: "user_key",
    session: "user_session",
  }),
  getUserAttributes: (user) => ({
    ...user,
  }),
});

export type Auth = typeof auth;
