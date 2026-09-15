"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminNavLink } from "@/components/admin/AdminNavLink";
import { cn } from "@/lib/utils";

type NavIconName =
  | "dashboard"
  | "member"
  | "stock"
  | "cashflow"
  | "report"
  | "website"
  | "settings";

type NavChild = { href: string; label: string; adminOnly?: boolean };

type NavItem =
  | { kind: "link"; href: string; label: string; icon: NavIconName }
  | { kind: "group"; id: string; label: string; icon: NavIconName; children: NavChild[] };

const OPEN_KEY = "codista-admin-nav";
const COLLAPSE_KEY = "codista-admin-sidebar-collapsed";

const navItems: NavItem[] = [
  { kind: "link", href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  {
    kind: "group",
    id: "member",
    label: "Member",
    icon: "member",
    children: [
      { href: "/admin/members", label: "List" },
      { href: "/admin/attendance", label: "Attendance" },
    ],
  },
  { kind: "link", href: "/admin/stock", label: "Stock", icon: "stock" },
  { kind: "link", href: "/admin/cashflow", label: "Cashflow", icon: "cashflow" },
  {
    kind: "group",
    id: "report",
    label: "Report",
    icon: "report",
    children: [
      { href: "/admin/reports/payments", label: "Payments" },
      { href: "/admin/reports/attendance", label: "Attendance" },
      { href: "/admin/reports/stock", label: "Stock" },
      { href: "/admin/reports/cashflow", label: "Cashflow" },
    ],
  },
  {
    kind: "group",
    id: "website",
    label: "Website",
    icon: "website",
    children: [
      { href: "/admin/cms/achievements", label: "Achievements" },
      { href: "/admin/cms/gallery", label: "Gallery" },
      { href: "/admin/cms/videos", label: "Videos" },
      { href: "/admin/cms/leadership", label: "Leadership" },
    ],
  },
  {
    kind: "group",
    id: "settings",
    label: "Settings",
    icon: "settings",
    children: [
      { href: "/admin/settings/fee-rules", label: "Fee rules", adminOnly: true },
      { href: "/admin/settings/class-plans", label: "Class plans" },
      { href: "/admin/settings/extra-classes", label: "Extra classes" },
      { href: "/admin/settings/batches", label: "Batches" },
      { href: "/admin/settings/belts", label: "Belt grades" },
      { href: "/admin/settings/branches", label: "Branches", adminOnly: true },
      { href: "/admin/settings/users", label: "Users", adminOnly: true },
    ],
  },
];

function pathMatches(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function visibleChildren(item: Extract<NavItem, { kind: "group" }>, isAdmin: boolean) {
  return item.children.filter((child) => !child.adminOnly || isAdmin);
}

function itemIsActive(item: NavItem, pathname: string, isAdmin: boolean) {
  if (item.kind === "link") return pathMatches(item.href, pathname);
  return visibleChildren(item, isAdmin).some((child) => pathMatches(child.href, pathname));
}

/** Keep at most one group open (accordion). Pass null to close all. */
function accordionOpenMap(prev: Record<string, boolean>, openId: string | null) {
  const next: Record<string, boolean> = {};
  for (const key of Object.keys(prev)) {
    next[key] = key === openId;
  }
  if (openId && !(openId in next)) next[openId] = true;
  return next;
}

function NavIcon({ name }: { name: NavIconName }) {
  const className = "h-5 w-5 shrink-0";
  switch (name) {
    case "dashboard":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5 12 4l8 6.5V20a1 1 0 01-1 1h-5.5v-6h-3v6H5a1 1 0 01-1-1v-9.5z" />
        </svg>
      );
    case "member":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1" />
          <circle cx="10" cy="8" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 19v-1a3.5 3.5 0 00-2.5-3.35M16.5 5.1a3 3 0 010 5.8" />
        </svg>
      );
    case "stock":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25 12 3 3 8.25v7.5L12 21l9-5.25v-7.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25 12 13.5 21 8.25M12 13.5V21" />
        </svg>
      );
    case "cashflow":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path strokeLinecap="round" d="M3 10h18" />
          <circle cx="16.5" cy="14.5" r="1.25" />
        </svg>
      );
    case "report":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16" />
          <path strokeLinecap="round" d="M8 16v-5M12 16V8M16 16v-8" />
        </svg>
      );
    case "website":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M3 12h18M12 3c2.8 3.2 2.8 14.8 0 18M12 3c-2.8 3.2-2.8 14.8 0 18" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.4 13.5a7.6 7.6 0 00.1-3l1.8-1.4-1.8-3.1-2.1.5a7.7 7.7 0 00-2.6-1.5L14.4 3h-4.8L9.2 4.9a7.7 7.7 0 00-2.6 1.5l-2.1-.5-1.8 3.1L4.5 10.4a7.6 7.6 0 000 3l-1.8 1.4 1.8 3.1 2.1-.5a7.7 7.7 0 002.6 1.5L9.6 21h4.8l.4-1.9a7.7 7.7 0 002.6-1.5l2.1.5 1.8-3.1-1.9-1.5z"
          />
        </svg>
      );
  }
}

export function AdminSidebar({
  isAdmin,
  forceExpanded = false,
  onNavigate,
}: {
  isAdmin: boolean;
  forceExpanded?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const activeId = useMemo(() => {
    const match = navItems.find((item) => itemIsActive(item, pathname, isAdmin));
    return match && match.kind === "group" ? match.id : null;
  }, [pathname, isAdmin]);

  const [collapsedState, setCollapsed] = useState(false);
  const collapsed = forceExpanded ? false : collapsedState;
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      navItems.filter((item): item is Extract<NavItem, { kind: "group" }> => item.kind === "group").map((g) => [g.id, false]),
    ),
  );

  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OPEN_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        const storedOpenId = Object.keys(parsed).find((key) => parsed[key]) ?? null;
        const openId = activeId ?? storedOpenId;
        setOpenMap((prev) => accordionOpenMap(prev, openId));
        return;
      }
    } catch {
      /* ignore */
    }
    if (activeId) setOpenMap((prev) => accordionOpenMap(prev, activeId));
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    setOpenMap((prev) => {
      if (prev[activeId] && Object.values(prev).filter(Boolean).length === 1) return prev;
      const next = accordionOpenMap(prev, activeId);
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [activeId]);

  function persistOpen(next: Record<string, boolean>) {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function persistCollapsed(next: boolean) {
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function toggleCollapsed() {
    if (forceExpanded) return;
    setCollapsed((prev) => {
      const next = !prev;
      persistCollapsed(next);
      return next;
    });
  }

  function toggleGroup(id: string) {
    if (collapsed) {
      setCollapsed(false);
      persistCollapsed(false);
      setOpenMap((prev) => {
        const next = accordionOpenMap(prev, id);
        persistOpen(next);
        return next;
      });
      return;
    }
    setOpenMap((prev) => {
      const next = accordionOpenMap(prev, prev[id] ? null : id);
      persistOpen(next);
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col bg-[var(--admin-navy)] text-white transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[248px]",
      )}
    >
      <div className={cn("flex shrink-0 items-center border-b border-white/10", collapsed ? "flex-col gap-2 px-2 py-3" : "justify-between px-3 py-3")}>
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-3")}
        >
          <Image
            src="/logo/logo.jpg"
            alt="CODISTA"
            width={40}
            height={40}
            className="h-10 w-10 rounded-md bg-white object-contain p-0.5"
            priority
          />
          {collapsed ? null : (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-wide">CODISTA</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">Academy Admin</p>
            </div>
          )}
        </Link>
        {forceExpanded ? null : (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className={cn("h-4 w-4 transition-transform", collapsed ? "rotate-180" : "")}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.83 10l3.94 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      <nav className="admin-sidebar-nav min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {navItems.map((item) => {
          if (item.kind === "link") {
            const active = pathMatches(item.href, pathname);
            return (
              <AdminNavLink
                key={item.href}
                href={item.href}
                active={active}
                title={item.label}
                className={collapsed ? "justify-center px-2" : undefined}
                onClick={onNavigate}
              >
                <NavIcon name={item.icon} />
                {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
              </AdminNavLink>
            );
          }

          const children = visibleChildren(item, isAdmin);
          if (!children.length) return null;
          const open = !collapsed && (openMap[item.id] ?? item.id === activeId);
          const groupActive = itemIsActive(item, pathname, isAdmin);

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => toggleGroup(item.id)}
                title={item.label}
                className={cn(
                  "flex w-full items-center rounded-md py-2 text-sm font-medium transition",
                  collapsed ? "justify-center px-2" : "gap-2.5 px-2.5",
                  groupActive
                    ? "bg-white/10 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
                aria-expanded={open}
              >
                <NavIcon name={item.icon} />
                {collapsed ? (
                  <span className="sr-only">{item.label}</span>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                    <svg
                      className={cn("h-3.5 w-3.5 shrink-0 text-white/60 transition-transform", open ? "rotate-90" : "")}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </>
                )}
              </button>
              {open ? (
                <ul className="mb-2 ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                  {children.map((child) => (
                    <li key={child.href}>
                      <AdminNavLink
                        href={child.href}
                        active={pathMatches(child.href, pathname)}
                        className="px-2 py-1.5 text-[13px]"
                        onClick={onNavigate}
                      >
                        {child.label}
                      </AdminNavLink>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
