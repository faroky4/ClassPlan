import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isAuthPage = pathname === "/login";

  if (!token) {
    if (isAuthPage) return NextResponse.next();
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as "host" | "teacher";

  if (isAuthPage) {
    return NextResponse.redirect(new URL(role === "host" ? "/host" : "/teacher", req.url));
  }

  if (pathname.startsWith("/host") && role !== "host") {
    return NextResponse.redirect(new URL("/teacher", req.url));
  }

  if (pathname.startsWith("/teacher") && role !== "teacher") {
    return NextResponse.redirect(new URL("/host", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/host/:path*", "/teacher/:path*"],
};
