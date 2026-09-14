import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (!pathname.startsWith("/admin")) return true;
      if (pathname === "/admin/login") return true;
      if (pathname.startsWith("/api/auth")) return true;
      return !!auth;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as {
          role?: string;
          branchIds?: string[];
        };
        token.role = u.role;
        token.branchIds = u.branchIds;
        token.activeBranchId = u.branchIds?.[0];
      }
      if (trigger === "update" && session?.activeBranchId) {
        const allowed =
          token.role === "ADMIN" ||
          (token.branchIds ?? []).includes(session.activeBranchId);
        if (allowed) token.activeBranchId = session.activeBranchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).branchIds = token.branchIds ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).activeBranchId = token.activeBranchId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
