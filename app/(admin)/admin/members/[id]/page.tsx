import { notFound } from "next/navigation";
import {
  PageHeader,
  AdminCard,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { CollectPaymentModal } from "@/components/admin/CollectPaymentModal";
import { NewMemberForm } from "@/components/admin/NewMemberForm";
import { canAccessBranch, requireSession } from "@/lib/auth-helpers";
import {
  getAcademySettings,
  membershipStatus,
  statusLabel,
  type JoiningSlab,
} from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR } from "@/lib/utils";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const settings = await getAcademySettings();
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      membership: true,
      classPlan: true,
      beltGrade: true,
      batches: { include: { batch: true } },
      extraClasses: { include: { extraClass: true } },
      payments: { orderBy: { paidAt: "desc" }, take: 20 },
    },
  });
  if (!member || !canAccessBranch(user, member.branchId)) notFound();

  const [plans, extras, batches, belts, bloodGroups] = await Promise.all([
    prisma.classPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.extraClass.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.batch.findMany({
      where: { isActive: true, OR: [{ branchId: member.branchId }, { branchId: null }] },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.beltGrade.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.bloodGroup.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
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
            <CollectPaymentModal trigger="Collect payment" memberId={member.id} />
          </div>
        }
      />

      <NewMemberForm
        mode="edit"
        plans={plans.map((p) => ({ id: p.id, name: p.name, fee: Number(p.fee) }))}
        extras={extras.map((e) => ({ id: e.id, name: e.name, fee: Number(e.fee) }))}
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        belts={belts.map((b) => ({ id: b.id, name: b.name }))}
        bloodGroups={bloodGroups.map((g) => ({ name: g.name }))}
        joiningFee={Number(settings.joiningFee)}
        joiningFeeSlabs={(settings.joiningFeeSlabs as JoiningSlab[]) ?? []}
        defaults={{
          id: member.id,
          name: member.name,
          gender: member.gender,
          dob: member.dob.toISOString().slice(0, 10),
          bloodGroup: member.bloodGroup ?? "",
          mobile: member.mobile,
          address: member.address,
          fatherName: member.fatherName ?? "",
          fatherContact: member.fatherContact ?? "",
          institute: member.institute ?? "",
          schoolClass: member.schoolClass ?? "",
          joiningDate: member.joiningDate.toISOString().slice(0, 10),
          classPlanId: member.classPlanId,
          beltGradeId: member.beltGradeId,
          batchIds: member.batches.map((b) => b.batchId),
          extraClassIds: member.extraClasses.map((e) => e.extraClassId),
        }}
      />

      <AdminCard title="Payment history">
        <AdminResponsiveList
          tableWrapClassName="border-0"
          cards={
            member.payments.length ? (
              member.payments.map((p) => (
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
                <p className="text-center text-sm text-[var(--admin-muted)]">No payments yet</p>
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
                {member.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.receiptNo}</td>
                    <td>{formatDate(p.paidAt)}</td>
                    <td>{formatINR(Number(p.amountPaid))}</td>
                    <td>{p.mode}</td>
                    <td>{formatDate(p.validUntil)}</td>
                  </tr>
                ))}
                {!member.payments.length ? (
                  <AdminEmptyRow colSpan={5} message="No payments yet" />
                ) : null}
              </tbody>
            </table>
          }
        />
      </AdminCard>
    </div>
  );
}
