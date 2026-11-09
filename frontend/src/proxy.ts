import { NextResponse, type NextRequest } from "next/server";

const COOKIE = process.env.AUTH_COOKIE_NAME ?? "tripnaro_token";

/**
 * Fast edge-side redirect for signed-out visitors on private areas. This only checks that a
 * session cookie exists; the API still verifies the JWT and role on every request.
 */
export function proxy(req: NextRequest) {
  if (!req.cookies.get(COOKIE)?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/my-account/:path*", "/admin/:path*", "/checkout/:path*"] };
