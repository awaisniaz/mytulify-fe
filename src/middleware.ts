import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOOL_CANONICAL_REDIRECTS } from "@/lib/catalog/canonical-redirects";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";

const LOCALE_HEADER = "x-mytulify-locale";

/**
 * - Set locale cookie/header from ?lang= for hreflang URLs
 * - Enforce single-hop 301s for duplicate tool URLs
 */
export function middleware(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");

  const path = request.nextUrl.pathname.replace(/\/$/, "") || "/";
  const key = path.replace(/^\//, "");
  const dest = TOOL_CANONICAL_REDIRECTS[key];

  if (lang && isLocale(lang)) {
    const response = dest
      ? NextResponse.redirect(new URL(`/${dest}?lang=${lang}`, request.url), 301)
      : NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    response.headers.set(LOCALE_HEADER, lang);
    return response;
  }

  if (dest) {
    const url = request.nextUrl.clone();
    url.pathname = `/${dest}`;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
