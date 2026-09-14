import { cache } from "react";
import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const ACTIVE_BRANCH_COOKIE = "codista-active-branch";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchIds: string[];
  activeBranchId?: string;
};

/** Dedupes auth() within a single RSC request (layout + page). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
});

export async function requireSession() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireSession();
  if (user.role !== Role.ADMIN) throw new Error("Forbidden");
  return user;
}

export function canAccessBranch(user: SessionUser, branchId: string) {
  if (user.role === Role.ADMIN) return true;
  return user.branchIds.includes(branchId);
}

const fetchAllActiveBranches = unstable_cache(
  async () =>
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ["admin-active-branches"],
  { revalidate: 60, tags: ["admin-branches"] },
);

const fetchBranchesByIds = unstable_cache(
  async (idsKey: string) => {
    const ids = idsKey.split(",").filter(Boolean);
    if (!ids.length) return [];
    return prisma.branch.findMany({
      where: { id: { in: ids }, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  },
  ["admin-branches-by-ids"],
  { revalidate: 60, tags: ["admin-branches"] },
);

export async function getActiveBranchId(user?: SessionUser) {
  const u = user ?? (await requireSession());

  const jar = await cookies();
  const fromCookie = jar.get(ACTIVE_BRANCH_COOKIE)?.value;
  if (fromCookie && canAccessBranch(u, fromCookie)) {
    return fromCookie;
  }

  if (u.activeBranchId && canAccessBranch(u, u.activeBranchId)) {
    return u.activeBranchId;
  }
  if (u.role === Role.ADMIN) {
    const branches = await fetchAllActiveBranches();
    return branches[0]?.id ?? null;
  }
  return u.branchIds[0] ?? null;
}

export async function listAccessibleBranches(user?: SessionUser) {
  const u = user ?? (await requireSession());
  if (u.role === Role.ADMIN) {
    return fetchAllActiveBranches();
  }
  return fetchBranchesByIds(u.branchIds.join(","));
}
