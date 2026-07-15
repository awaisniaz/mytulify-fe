import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOOL_CANONICAL_REDIRECTS } from "@/lib/catalog/canonical-redirects";

/**
 * Enforce single-hop 301s for duplicate tool URLs.
 * Complements next.config redirects (covers edge cases where config redirects miss).
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/\/$/, "") || "/";
  const key = path.replace(/^\//, "");
  const dest = TOOL_CANONICAL_REDIRECTS[key];
  if (!dest) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${dest}`;
  return NextResponse.redirect(url, 301);
}

export const config = {
  // Only tool-like routes: /category/slug
  matcher: ["/:category/:tool"],
};
