"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BranchSwitcher } from "@/components/admin/BranchSwitcher";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { cn } from "@/lib/utils";

export function AdminAppShell({
  isAdmin,
  userName,
  roleLabel,
  branches,
  activeBranchId,
  children,
}: {
  isAdmin: boolean;
  userName: string;
  roleLabel: string;
  branches: { id: string; name: string }[];
  activeBranchId?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="admin-app flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden h-full shrink-0 lg:flex">
        <AdminSidebar isAdmin={isAdmin} />
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-slate-900/45 transition-opacity",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex h-full max-w-[min(100vw,280px)] transition-transform duration-200",
            "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <AdminSidebar isAdmin={isAdmin} forceExpanded onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "flex shrink-0 flex-col gap-2 border-b border-[var(--admin-border)] bg-white",
            "px-4 py-3 lg:px-6",
            "pt-[max(0.75rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--admin-border)] text-gray-700 hover:bg-gray-50 lg:hidden"
                aria-label="Open navigation"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen(true)}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>
                <p className="text-xs text-[var(--admin-muted)]">{roleLabel}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <div className="hidden min-w-0 sm:block">
                <BranchSwitcher branches={branches} activeBranchId={activeBranchId} />
              </div>
              <LogoutButton />
            </div>
          </div>
          <div className="sm:hidden">
            <BranchSwitcher branches={branches} activeBranchId={activeBranchId} compact />
          </div>
        </header>
        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden p-4 lg:p-6",
            "pb-[max(1rem,env(safe-area-inset-bottom))]",
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-clip has-[[data-admin-fill-page]]:overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
