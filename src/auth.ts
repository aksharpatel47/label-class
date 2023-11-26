import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { unstable_noStore } from "next/cache";

async function getUser(email: string) {
  unstable_noStore();
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    JSON.stringify(user);

    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(
            password,
            user.passwordHash
          );

          if (passwordsMatch)
            return {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
            };
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
