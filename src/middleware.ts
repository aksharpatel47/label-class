import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_SESSION_COOKIE_NAME, createSessionCookie } from "@/lib/auth/cookie";
import { validateSession } from "@/lib/auth/session";

export const runtime = 'nodejs';

// Routes that don't require authentication
const publicRoutes = ["/login", "/signup"];
// Routes that authenticated users should be redirected away from
const authRoutes = ["/", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session cookie from request
  const sessionId = request.cookies.get(DEFAULT_SESSION_COOKIE_NAME)?.value;

  let session = null;
  let fresh = false;

  if (sessionId) {
    const result = await validateSession(sessionId);
    if (result) {
      session = result.session;
      fresh = result.fresh;
    }
  }

  // Determine response type based on authentication state
  let response: NextResponse;

  // If user is authenticated and tries to access auth routes, redirect to /projects
  if (session && authRoutes.includes(pathname)) {
    response = NextResponse.redirect(new URL("/projects", request.url));
  }
  // If user is not authenticated and not on a public route, redirect to /login
  else if (!session && !publicRoutes.includes(pathname) && !pathname.startsWith("/api/auth")) {
    response = NextResponse.redirect(new URL("/login", request.url));
  }
  // Otherwise, continue to the requested page
  else {
    response = NextResponse.next();
  }

  // Handle session cookie updates for all responses
  if (session && fresh) {
    // If session is fresh (was extended), update the cookie
    const newCookie = createSessionCookie(session);
    response.cookies.set(
      newCookie.name,
      newCookie.value,
      newCookie.attributes
    );
  } else if (sessionId && !session) {
    // If session is invalid, clear the cookie
    response.cookies.delete(DEFAULT_SESSION_COOKIE_NAME);
  }

  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     * - Server Actions (handled separately)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
