import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOOL_CANONICAL_REDIRECTS } from "@/lib/catalog/canonical-redirects";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { isEnglishOnlyPath } from "@/i18n/paths";

const LOCALE_HEADER = "x-mytulify-locale";
const CANONICAL_HOST = "www.mytulify.com";

function rememberLocale(response: NextResponse, lang: string) {
  response.cookies.set(LOCALE_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  response.headers.set(LOCALE_HEADER, lang);
}

function redirectTo(
  request: NextRequest,
  pathname: string,
  opts: { forceCanonicalHost: boolean; dropLang: boolean },
): NextResponse {
  const url = request.nextUrl.clone();
  if (opts.forceCanonicalHost) {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
  }
  url.pathname = pathname;
  if (opts.dropLang) url.searchParams.delete("lang");
  return NextResponse.redirect(url, 301);
}

/**
 * - Apex (mytulify.com) + duplicate tool paths → single 301 to www canonical URL
 * - ?lang= on English-only pages (blog, legal) → 301 to the clean URL.
 *   A 200 that canonicalizes elsewhere and also sends noindex makes Google
 *   reject the declared canonical ("Duplicate, Google chose different canonical than user").
 * - ?lang= on translated pages → cookie/header for hreflang
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const isApex = host === "mytulify.com";
  const lang = request.nextUrl.searchParams.get("lang");
  const validLang = lang && isLocale(lang) ? lang : null;

  const path = request.nextUrl.pathname.replace(/\/$/, "") || "/";
  const key = path.replace(/^\//, "");
  const dest = TOOL_CANONICAL_REDIRECTS[key];
  const targetPath = dest ? `/${dest}` : path;
  const dropLang = request.nextUrl.searchParams.has("lang") && isEnglishOnlyPath(targetPath);

  // One hop: non-www, legacy tool URL, and/or ?lang= on an English-only page.
  if (isApex || dest || dropLang) {
    const response = redirectTo(request, targetPath, {
      forceCanonicalHost: isApex || Boolean(dest),
      dropLang,
    });
    if (validLang) rememberLocale(response, validLang);
    return response;
  }

  if (validLang) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, validLang);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    rememberLocale(response, validLang);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
