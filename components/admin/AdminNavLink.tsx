"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

function NavPendingDot() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className="ml-auto inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-white"
      aria-hidden
    />
  );
}

export function AdminNavLink({
  href,
  active,
  children,
  className,
  title,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      title={title}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition",
        active
          ? "bg-[var(--admin-red)] text-white"
          : "text-white/80 hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      {children}
      <NavPendingDot />
    </Link>
  );
}
