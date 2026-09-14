import Link from "next/link";
import {
  PageHeader,
  AdminCard,
  SubmitButton,
  AdminTableWrap,
  AdminSelect,
  AdminEmptyRow,
} from "@/components/admin/ui";
import { MemberRowActions } from "@/components/admin/MemberRowActions";
import { requireSession, getActiveBranchId } from "@/lib/auth-helpers";
import { getAcademySettings, membershipStatus, statusLabel } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; batchId?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireSession();
  const branchId = await getActiveBranchId(user);
  const settings = await getAcademySettings();

  if (!branchId) {
    return (
      <div>
        <PageHeader title="Members" />
        <AdminCard>
          <p className="text-sm text-[var(--admin-muted)]">No branch selected.</p>
        </AdminCard>
      </div>
    );
  }

  const batches = await prisma.batch.findMany({
    where: { OR: [{ branchId }, { branchId: null }], isActive: true },
    orderBy: { name: "asc" },
  });

  const members = await prisma.member.findMany({
    where: {
      branchId,
      ...(sp.q
        ? {
            OR: [
              { name: { contains: sp.q, mode: "insensitive" } },
              { code: { contains: sp.q, mode: "insensitive" } },
              { mobile: { contains: sp.q } },
            ],
          }
        : {}),
      ...(sp.batchId ? { batches: { some: { batchId: sp.batchId } } } : {}),
    },
    include: {
      membership: true,
      classPlan: true,
      beltGrade: true,
      batches: { include: { batch: true } },
    },
    orderBy: { name: "asc" },
  });

  const filtered = members.filter((m) => {
    if (!sp.status) return true;
    const s = membershipStatus(m.isActive, m.membership?.validUntil, settings.expiringSoonDays);
    return s === sp.status;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description={`${filtered.length} shown`}
        actions={
          <Link href="/admin/members/new" className="btn-primary">
            Add member
          </Link>
        }
      />

      <AdminCard>
        <form className="flex flex-wrap gap-3">
          <input
            className="admin-input max-w-xs"
            name="q"
            placeholder="Search name / code / mobile"
            defaultValue={sp.q}
          />
          <AdminSelect
            className="max-w-xs"
            name="batchId"
            defaultValue={sp.batchId ?? ""}
            placeholder="All batches"
            options={batches.map((b) => ({ value: b.id, label: b.name }))}
          />
          <AdminSelect
            className="max-w-xs"
            name="status"
            defaultValue={sp.status ?? ""}
            placeholder="All statuses"
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "EXPIRING", label: "Expiring" },
              { value: "EXPIRED", label: "Expired" },
              { value: "INACTIVE", label: "Inactive" },
              { value: "NONE", label: "No membership" },
            ]}
          />
          <SubmitButton pendingLabel="Filtering…">Filter</SubmitButton>
        </form>
      </AdminCard>

      <AdminTableWrap>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Plan</th>
              <th>Batches</th>
              <th>Valid until</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const status = membershipStatus(
                m.isActive,
                m.membership?.validUntil,
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
                <tr key={m.id}>
                  <td className="font-mono text-xs">{m.code}</td>
                  <td>
                    <Link className="admin-link" href={`/admin/members/${m.id}`}>
                      {m.name}
                    </Link>
                    <p className="text-xs text-[var(--admin-muted)]">{m.mobile}</p>
                  </td>
                  <td>{m.classPlan.name}</td>
                  <td>{m.batches.map((b) => b.batch.name).join(", ") || "—"}</td>
                  <td>{formatDate(m.membership?.validUntil)}</td>
                  <td>
                    <span className={badge}>{statusLabel(status)}</span>
                  </td>
                  <td>
                    <MemberRowActions memberId={m.id} isActive={m.isActive} />
                  </td>
                </tr>
              );
            })}
            {!filtered.length ? (
              <AdminEmptyRow colSpan={7} message="No members match these filters." />
            ) : null}
          </tbody>
        </table>
      </AdminTableWrap>
    </div>
  );
}
