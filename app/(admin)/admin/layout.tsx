import { Role } from "@prisma/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BranchSwitcher } from "@/components/admin/BranchSwitcher";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { Providers } from "@/components/Providers";
import { getActiveBranchId, getSessionUser, listAccessibleBranches } from "@/lib/auth-helpers";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <Providers>
        <div className="admin-app min-h-screen">{children}</div>
      </Providers>
    );
  }

  const [branches, activeBranchId] = await Promise.all([
    listAccessibleBranches(user),
    getActiveBranchId(user),
  ]);

  return (
    <Providers>
      <div className="admin-app flex h-svh overflow-hidden">
        <AdminSidebar isAdmin={user.role === Role.ADMIN} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--admin-border)] bg-white px-6 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-[var(--admin-muted)]">
                {user.role === Role.ADMIN ? "Admin" : "Branch Admin"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <BranchSwitcher
                branches={branches}
                activeBranchId={activeBranchId ?? undefined}
              />
              <LogoutButton />
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-clip p-6">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
