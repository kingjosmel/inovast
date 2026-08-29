import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";
import type { UserRole } from "@/models/User";

const { auth } = NextAuth(authConfig);

const protectedRoutes: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/api/merchant", roles: ["MERCHANT_ADMIN", "SUPER_ADMIN"] },
  { prefix: "/merchant", roles: ["MERCHANT_ADMIN", "SUPER_ADMIN"] },
  { prefix: "/api/rider", roles: ["RIDER", "SUPER_ADMIN"] },
  { prefix: "/rider", roles: ["RIDER", "SUPER_ADMIN"] },
  { prefix: "/api/admin", roles: ["SUPER_ADMIN"] },
  { prefix: "/admin", roles: ["SUPER_ADMIN"] },
];

export default auth((request) => {
  const matchedRoute = protectedRoutes.find(({ prefix }) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (!matchedRoute) {
    return NextResponse.next();
  }

  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const role = request.auth?.user?.role;

  if (!request.auth) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const signInUrl = new URL("/api/auth/signin", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  if (!role || !matchedRoute.roles.includes(role)) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/unauthorized", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/api/merchant/:path*",
    "/merchant/:path*",
    "/api/rider/:path*",
    "/rider/:path*",
    "/api/admin/:path*",
    "/admin/:path*",
  ],
};
