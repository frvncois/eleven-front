import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, getSecret, isValidSessionToken } from "@/lib/auth";

/**
 * Client review prototype: every page needs the shared password.
 * Unauthenticated visitors land on /enter and come back to where they were.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!(await isValidSessionToken(token, getSecret()))) {
    const url = new URL("/enter", request.url);
    const next = request.nextUrl.pathname + request.nextUrl.search;
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: ["/((?!enter|_next/static|_next/image|fonts|media|sounds|favicon.ico|icon|robots.txt).*)"],
};
