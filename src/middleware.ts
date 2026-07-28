import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOOL_CANONICAL_REDIRECTS } from "@/lib/catalog/canonical-redirects";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { isEnglishOnlyPath } from "@/i18n/paths";

const LOCALE_HEADER = "x-mytulify-locale";
const CANONICAL_HOST = "www.mytulify.com";

function canonicalRedirect(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = CANONICAL_HOST;
  url.pathname = pathname;
  return NextResponse.redirect(url, 301);
}

/**
 * - Apex (mytulify.com) + duplicate tool paths → single 301 to www canonical URL
 * - ?lang= cookie/header for hreflang
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const isApex = host === "mytulify.com";
  const lang = request.nextUrl.searchParams.get("lang");

  const path = request.nextUrl.pathname.replace(/\/$/, "") || "/";
  const key = path.replace(/^\//, "");
  const dest = TOOL_CANONICAL_REDIRECTS[key];

  // One hop: non-www and/or legacy tool URL → https://www.mytulify.com/{canonical-path}
  if (isApex || dest) {
    const targetPath = dest ? `/${dest}` : path;
    const response = canonicalRedirect(request, targetPath);
    if (lang && isLocale(lang)) {
      response.cookies.set(LOCALE_COOKIE, lang, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      response.headers.set(LOCALE_HEADER, lang);
    }
    return response;
  }

  if (lang && isLocale(lang)) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    response.headers.set(LOCALE_HEADER, lang);
    if (isEnglishOnlyPath(path)) {
      response.headers.set("X-Robots-Tag", "noindex, follow");
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
