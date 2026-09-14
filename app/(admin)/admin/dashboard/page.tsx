import Link from "next/link";
import { PageHeader, AdminCard } from "@/components/admin/ui";
import { requireSession, getActiveBranchId } from "@/lib/auth-helpers";
import { getAcademySettings, membershipStatus } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { startOfDay } from "date-fns";

export default async function DashboardPage() {
  const user = await requireSession();
  const branchId = await getActiveBranchId(user);
  const settings = await getAcademySettings();
  const today = startOfDay(new Date());

  if (!branchId) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <AdminCard>
          <p className="text-sm text-[var(--admin-muted)]">
            No branch assigned. Ask an Admin to assign a branch.
          </p>
        </AdminCard>
      </div>
    );
  }

  const members = await prisma.member.findMany({
    where: { branchId },
    include: { membership: true },
  });

  let active = 0;
  let expiring = 0;
  let expired = 0;
  for (const m of members) {
    const s = membershipStatus(
      m.isActive,
      m.membership?.validUntil,
      settings.expiringSoonDays,
      today,
    );
    if (s === "ACTIVE") active++;
    else if (s === "EXPIRING") expiring++;
    else if (s === "EXPIRED") expired++;
  }

  const sessionsToday = await prisma.attendanceSession.findMany({
    where: { branchId, date: today },
    include: { entries: true },
  });
  const present = sessionsToday.reduce(
    (n, s) => n + s.entries.filter((e) => e.isPresent).length,
    0,
  );
  const totalMarked = sessionsToday.reduce((n, s) => n + s.entries.length, 0);
  const attendancePct = totalMarked ? Math.round((present / totalMarked) * 100) : 0;

  const cashToday = await prisma.cashEntry.aggregate({
    where: {
      branchId,
      type: "INCOME",
      entryDate: today,
    },
    _sum: { amount: true },
  });

  const lowStock = await prisma.stockItem.findMany({
    where: { isActive: true },
    include: { variants: true },
  });
  const lowCount = lowStock.filter((item) => {
    const qty = item.variants.reduce((n, v) => n + v.quantity, 0);
    return qty <= item.lowStockAt;
  }).length;

  const cards = [
    { label: "Active members", value: String(active), href: "/admin/members?status=ACTIVE" },
    { label: "Expiring soon", value: String(expiring), href: "/admin/members?status=EXPIRING" },
    { label: "Expired", value: String(expired), href: "/admin/members?status=EXPIRED" },
    { label: "Attendance today", value: `${attendancePct}%`, href: "/admin/attendance" },
    {
      label: "Cash in today",
      value: formatINR(Number(cashToday._sum.amount ?? 0)),
      href: "/admin/cashflow",
    },
    { label: "Low stock items", value: String(lowCount), href: "/admin/stock" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview for the selected branch" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="admin-card transition hover:border-[var(--admin-navy)]"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
              {c.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--admin-navy)]">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
