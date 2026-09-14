import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function isAdminHost(host: string) {
  const adminHost = (process.env.ADMIN_HOST ?? "admin.localhost:3000").toLowerCase();
  const h = host.toLowerCase().split(":")[0];
  const adminName = adminHost.split(":")[0];
  return (
    h === adminName ||
    h.startsWith("admin.") ||
    h === "admin.localhost" ||
    host.toLowerCase().includes("admin.codista.in")
  );
}

export default auth((req) => {
  const host = req.headers.get("host") ?? "localhost:3000";
  const { pathname } = req.nextUrl;
  const admin = isAdminHost(host);

  if (!admin && pathname.startsWith("/admin")) {
    // Allow /admin on localhost for local development
    const isLocal =
      host.startsWith("localhost") || host.startsWith("127.0.0.1");
    if (!isLocal) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (admin && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!req.auth) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  if (req.auth && pathname === "/admin/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
