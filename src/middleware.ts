import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route Protection Middleware
 * Runs on the Edge before any page is rendered.
 *
 * Protected prefix: /app/*
 * Public routes:    / (landing), /onboarding, /upload (token checked client-side there)
 *
 * Token is stored in localStorage (client-only), so we can't read it here directly.
 * Instead we use a short-lived cookie "quant_auth" that the app sets on login
 * and clears on logout. Middleware checks this cookie.
 *
 * If the cookie is absent → redirect to / with ?redirect=<original path>
 * so the landing page can deep-link back after login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /app/* routes
  if (!pathname.startsWith("/app")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("quant_auth")?.value;

  if (!token) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
