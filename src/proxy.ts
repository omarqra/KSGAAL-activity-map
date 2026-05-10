import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "src/i18n/routing";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySession } from "@/lib/auth/jwt";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATTERN = /^\/(ar|en)\/dashboard(\/|$)/;
const LOGIN_PATTERN = /^\/(ar|en)\/auth\/login(\/|$|\?)/i;

function buildLoginUrl(req: NextRequest, locale: string, from: string): URL {
  const url = new URL(`/${locale}/auth/login`, req.url);
  url.searchParams.set("from", from);
  return url;
}

function buildDashboardUrl(req: NextRequest, locale: string): URL {
  return new URL(`/${locale}/dashboard`, req.url);
}

function enforceHttps(req: NextRequest): NextResponse | null {
  // eslint-disable-next-line n/no-process-env
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1"
  ) {
    return null;
  }

  const xfProto = req.headers.get("x-forwarded-proto");
  const proto =
    (xfProto?.split(",")[0]?.trim().toLowerCase() ?? "") ||
    req.nextUrl.protocol.replace(":", "").toLowerCase();

  if (proto === "http") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = host;
    return NextResponse.redirect(url, 308);
  }

  return null;
}

export default async function proxy(req: NextRequest): Promise<Response> {
  const httpsRedirect = enforceHttps(req);
  if (httpsRedirect) return httpsRedirect;

  const { pathname } = req.nextUrl;

  if (PROTECTED_PATTERN.test(pathname)) {
    const locale = pathname.split("/")[1];
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;
    if (!session) {
      return NextResponse.redirect(
        buildLoginUrl(req, locale, pathname + req.nextUrl.search)
      );
    }
  }

  if (LOGIN_PATTERN.test(pathname)) {
    const locale = pathname.split("/")[1];
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;
    if (session) {
      return NextResponse.redirect(buildDashboardUrl(req, locale));
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*"],
};
