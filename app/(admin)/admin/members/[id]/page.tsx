import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  PageHeader,
  AdminCard,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { BatchMiniBars } from "@/components/admin/BatchMiniBars";
import { CollectPaymentModal } from "@/components/admin/CollectPaymentModal";
import { MemberIdCardPrint } from "@/components/admin/MemberIdCard";
import { MemberPhotoUpload } from "@/components/admin/MemberPhotoUpload";
import { PaymentHistoryYearSelect } from "@/components/admin/PaymentHistoryYearSelect";
import { canAccessBranch, requireSession } from "@/lib/auth-helpers";
import { getMemberPerformance } from "@/lib/member-attendance";
import { getAcademySettings, membershipStatus, statusLabel } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR } from "@/lib/utils";

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[var(--admin-muted)]">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

function trendLabel(trend: number | null) {
  if (trend == null) return "—";
  if (trend > 0) return `↑ ${trend}%`;
  if (trend < 0) return `↓ ${Math.abs(trend)}%`;
  return "→ 0%";
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireSession();
  const settings = await getAcademySettings();
  const currentYear = new Date().getFullYear();

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      membership: true,
      classPlan: true,
      beltGrade: true,
      branch: true,
      batches: { include: { batch: true } },
      extraClasses: { include: { extraClass: true } },
    },
  });
  if (!member || !canAccessBranch(user, member.branchId)) notFound();

  const joiningYear = member.joiningDate.getFullYear();
  const yearStart = Math.min(joiningYear, currentYear);
  const years: number[] = [];
  for (let y = currentYear; y >= yearStart; y--) years.push(y);

  const parsedYear = Number(sp.year);
  const selectedYear =
    Number.isFinite(parsedYear) && years.includes(parsedYear) ? parsedYear : currentYear;

  const yearFrom = new Date(selectedYear, 0, 1);
  const yearTo = new Date(selectedYear + 1, 0, 1);

  const [payments, performance] = await Promise.all([
    prisma.payment.findMany({
      where: {
        memberId: member.id,
        paidAt: { gte: yearFrom, lt: yearTo },
      },
      orderBy: { paidAt: "desc" },
    }),
    getMemberPerformance(member.id),
  ]);

  const status = membershipStatus(
    member.isActive,
    member.membership?.validUntil,
    settings.expiringSoonDays,
  );

  const badge =
    status === "ACTIVE"
      ? "badge-active"
      : status === "EXPIRING"
        ? "badge-expiring"
        : status === "EXPIRED"
          ? "badge-expired"
          : "badge-inactive";

  return (
    <div className="space-y-6">
      <PageHeader
        title={member.name}
        description={`${member.code} · ${member.classPlan.name} · ${member.beltGrade.name} · Valid until ${formatDate(member.membership?.validUntil)}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <span className={badge}>{statusLabel(status)}</span>
            <Link href={`/admin/members/${member.id}/edit`} className="btn-secondary">
              Edit
            </Link>
            <MemberIdCardPrint
              member={{
                name: member.name,
                code: member.code,
                dob: member.dob,
                mobile: member.mobile,
                fatherName: member.fatherName,
                fatherContact: member.fatherContact,
                bloodGroup: member.bloodGroup,
                photoUrl: member.photoUrl,
                branchAddress: member.branch.address,
                branchPhone: member.branch.phone,
              }}
            />
            <CollectPaymentModal trigger="Collect payment" memberId={member.id} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Profile">
          <div className="space-y-4">
            <MemberPhotoUpload memberId={member.id} existingUrl={member.photoUrl} />
            <dl className="grid grid-cols-2 gap-3">
              <DetailItem label="Gender" value={member.gender} />
              <DetailItem label="DOB" value={formatDate(member.dob)} />
              <DetailItem label="Mobile" value={member.mobile} />
              <DetailItem label="Blood group" value={member.bloodGroup} />
              <DetailItem label="Emergency name" value={member.fatherName} />
              <DetailItem label="Emergency contact" value={member.fatherContact} />
              <div className="col-span-2">
                <DetailItem label="Address" value={member.address} />
              </div>
              <DetailItem label="Institute" value={member.institute} />
              <DetailItem label="Class / grade" value={member.schoolClass} />
            </dl>
          </div>
        </AdminCard>

        <AdminCard title="Academy">
          <dl className="grid grid-cols-2 gap-3">
            <DetailItem label="Branch" value={member.branch.name} />
            <DetailItem label="Joining date" value={formatDate(member.joiningDate)} />
            <DetailItem label="Class plan" value={member.classPlan.name} />
            <DetailItem label="Belt" value={member.beltGrade.name} />
            <DetailItem
              label="Batches"
              value={member.batches.map((b) => b.batch.name).join(", ") || "—"}
            />
            <DetailItem
              label="Extra classes"
              value={member.extraClasses.map((e) => e.extraClass.name).join(", ") || "—"}
            />
            <DetailItem
              label="Valid until"
              value={formatDate(member.membership?.validUntil)}
            />
            <DetailItem
              label="RFID card"
              value={
                member.rfidUid
                  ? `Assigned${member.rfidAssignedAt ? ` · ${formatDate(member.rfidAssignedAt)}` : ""}`
                  : "Not assigned"
              }
            />
          </dl>
        </AdminCard>
      </div>

      <AdminCard title="Attendance performance">
        {performance && performance.byBatch.length ? (
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                This month ({performance.monthLabel})
              </p>
              <BatchMiniBars batches={performance.byBatch} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm md:min-w-[14rem] md:grid-cols-1">
              <div>
                <dt className="text-xs text-[var(--admin-muted)]">Overall</dt>
                <dd className="font-semibold text-[var(--admin-navy)]">
                  {performance.pct != null ? `${performance.pct}%` : "—"}{" "}
                  <span className="font-normal text-[var(--admin-muted)]">
                    ({performance.present}/{performance.sessionsHeld})
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--admin-muted)]">Last month</dt>
                <dd>
                  {performance.lastPct != null
                    ? `${performance.lastPct}% (${performance.lastPresent}/${performance.lastSessionsHeld})`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--admin-muted)]">Trend</dt>
                <dd
                  className={
                    performance.trend != null && performance.trend > 0
                      ? "text-emerald-600"
                      : performance.trend != null && performance.trend < 0
                        ? "text-[var(--admin-red)]"
                        : undefined
                  }
                >
                  {trendLabel(performance.trend)}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="text-sm text-[var(--admin-muted)]">
            No batch mapping — attendance rates appear after the member is mapped to a batch.
          </p>
        )}
        <p className="mt-3 text-xs text-[var(--admin-muted)]">
          Rates use full calendar days in the month. Unmarked days count as absent.
        </p>
      </AdminCard>

      <AdminCard
        title="Payment history"
        actions={<PaymentHistoryYearSelect year={selectedYear} years={years} />}
      >
        <AdminResponsiveList
          tableWrapClassName="border-0"
          cards={
            payments.length ? (
              payments.map((p) => (
                <AdminListCard key={p.id} className="!shadow-none">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-[var(--admin-muted)]">{p.receiptNo}</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {formatINR(Number(p.amountPaid))}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--admin-muted)]">{formatDate(p.paidAt)}</p>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-[var(--admin-muted)]">Mode</dt>
                      <dd>{p.mode}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--admin-muted)]">Valid until</dt>
                      <dd>{formatDate(p.validUntil)}</dd>
                    </div>
                  </dl>
                </AdminListCard>
              ))
            ) : (
              <AdminListCard className="!shadow-none">
                <p className="text-center text-sm text-[var(--admin-muted)]">
                  No payments in {selectedYear}
                </p>
              </AdminListCard>
            )
          }
          table={
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Valid until</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.receiptNo}</td>
                    <td>{formatDate(p.paidAt)}</td>
                    <td>{formatINR(Number(p.amountPaid))}</td>
                    <td>{p.mode}</td>
                    <td>{formatDate(p.validUntil)}</td>
                  </tr>
                ))}
                {!payments.length ? (
                  <AdminEmptyRow colSpan={5} message={`No payments in ${selectedYear}`} />
                ) : null}
              </tbody>
            </table>
          }
        />
      </AdminCard>
    </div>
  );
}
