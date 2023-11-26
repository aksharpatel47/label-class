import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userOnLoginPage = nextUrl.pathname.startsWith("/login");

      if (isLoggedIn && !userOnLoginPage) {
        if (nextUrl.pathname === "/") {
          return Response.redirect(new URL("/projects", nextUrl));
        }
        return true;
      } else if (isLoggedIn && userOnLoginPage) {
        return Response.redirect(new URL("/projects", nextUrl));
      }

      return isLoggedIn;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
