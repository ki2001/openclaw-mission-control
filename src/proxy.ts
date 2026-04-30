import { NextRequest, NextResponse } from "next/server";

/**
 * HTTP Basic Auth proxy.
 * Protects all pages and API routes except /api/health.
 * Credentials: admin / DASHBOARD_PASSWORD from env.
 * Bearer token requests to API routes pass through (API handles its own auth).
 */

export function proxy(req: NextRequest) {
  // Allow health endpoint without auth (for monitoring)
  if (req.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization") || "";
  const expectedPassword = process.env.DASHBOARD_PASSWORD;

  if (!expectedPassword) {
    // No password configured — skip auth (dev fallback)
    return NextResponse.next();
  }

  // Bearer token requests to API routes pass through — the API route handles its own auth
  if (authHeader.startsWith("Bearer ") && req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check Basic Auth for browser requests
  if (authHeader.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice(6));
      const [user, pass] = decoded.split(":");
      if (user === "admin" && pass === expectedPassword) {
        return NextResponse.next();
      }
    } catch {
      // Invalid header format — fall through to challenge
    }
  }

  // Return 401 with WWW-Authenticate to trigger browser's native auth popup
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Mission Control"',
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and Next.js internals
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
