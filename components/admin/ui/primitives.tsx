import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-[var(--admin-muted)]">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>
      ) : null}
    </div>
  );
}

export function AdminCard({
  children,
  className,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("admin-card", className)}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {description ? <p className="mt-1 text-sm text-[var(--admin-muted)]">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminButton({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      className={cn(variant === "primary" ? "btn-primary" : "btn-secondary", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminTableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("admin-table-wrap", className)}>{children}</div>;
}

/** Mobile card stack + desktop table. Desktop layout unchanged at md+. */
export function AdminResponsiveList({
  cards,
  table,
  className,
  tableWrapClassName,
}: {
  cards: ReactNode;
  table: ReactNode;
  className?: string;
  tableWrapClassName?: string;
}) {
  return (
    <div className={className}>
      <div className="space-y-3 md:hidden">{cards}</div>
      <div className="hidden md:block">
        <AdminTableWrap className={tableWrapClassName}>{table}</AdminTableWrap>
      </div>
    </div>
  );
}

export function AdminListCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-[var(--admin-border)] bg-white p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}
