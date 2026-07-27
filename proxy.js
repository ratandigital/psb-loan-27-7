import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function proxy(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // ✅ Public Login Route
  if (pathname === "/login") {
    if (!token) return NextResponse.next();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.mustChangePassword) {
        return NextResponse.redirect(
          new URL("/force-change-password", request.url)
        );
      }

      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    } catch {
      return NextResponse.next();
    }
  }

  /* ✅ Protected Routes */
  const protectedPaths = [
    "/dashboard",
    "/employee",
    "/upload",
    "/branch-report",
    "/monthly-report",
    "/tomorrow-alert", // ✅ ADDED
  ];

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userRole = decoded.role;

      // ✅ Force Change Password
      if (
        decoded.mustChangePassword &&
        pathname !== "/force-change-password"
      ) {
        return NextResponse.redirect(
          new URL("/force-change-password", request.url)
        );
      }

      // ✅ Restricted Routes (Only Manager + Admin)
      const restrictedRoutes = [
        "/branch-report",
        "/upload",
        "/employee/upload",
      ];

      const isRestricted = restrictedRoutes.some((path) =>
        pathname.startsWith(path)
      );

      if (isRestricted) {
        if (
          userRole !== "Branch Manager" &&
          userRole !== "Admin"
        ) {
          return NextResponse.redirect(
            new URL("/dashboard", request.url)
          );
        }
      }

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/employee/:path*",
    "/upload/:path*",
    "/branch-report/:path*",
    "/monthly-report/:path*",
    "/tomorrow-alert/:path*", // ✅ ADDED
  ],
};