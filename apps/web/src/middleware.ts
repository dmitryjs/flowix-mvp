import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "flowix-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const isAuthorized = request.cookies.get(AUTH_COOKIE_NAME)?.value === "1";
  if (isAuthorized) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
