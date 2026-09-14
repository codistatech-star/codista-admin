import Link from "next/link";
import {
  PageHeader,
  AdminCard,
  SubmitButton,
  AdminSelect,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
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

  const statusFilter = sp.status ?? "ACTIVE";

  const filtered = members.filter((m) => {
    if (!statusFilter) return true;
    const s = membershipStatus(m.isActive, m.membership?.validUntil, settings.expiringSoonDays);
    return s === statusFilter;
  });

  function badgeClass(status: string) {
    return status === "ACTIVE"
      ? "badge-active"
      : status === "EXPIRING"
        ? "badge-expiring"
        : status === "EXPIRED"
          ? "badge-expired"
          : "badge-inactive";
  }

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
            className="admin-input w-full md:max-w-xs"
            name="q"
            placeholder="Search name / code / mobile"
            defaultValue={sp.q}
          />
          <AdminSelect
            className="w-full md:max-w-xs"
            name="batchId"
            defaultValue={sp.batchId ?? ""}
            placeholder="All batches"
            options={batches.map((b) => ({ value: b.id, label: b.name }))}
          />
          <AdminSelect
            className="w-full md:max-w-xs"
            name="status"
            defaultValue={statusFilter}
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

      <AdminResponsiveList
        cards={
          filtered.length ? (
            filtered.map((m) => {
              const status = membershipStatus(
                m.isActive,
                m.membership?.validUntil,
                settings.expiringSoonDays,
              );
              return (
                <AdminListCard key={m.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link className="admin-link text-base" href={`/admin/members/${m.id}`}>
                        {m.name}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-[var(--admin-muted)]">{m.code}</p>
                      <p className="text-xs text-[var(--admin-muted)]">{m.mobile}</p>
                    </div>
                    <span className={badgeClass(status)}>{statusLabel(status)}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-[var(--admin-muted)]">Plan</dt>
                      <dd>{m.classPlan.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--admin-muted)]">Valid until</dt>
                      <dd>{formatDate(m.membership?.validUntil)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-[var(--admin-muted)]">Batches</dt>
                      <dd>{m.batches.map((b) => b.batch.name).join(", ") || "—"}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex justify-end border-t border-[var(--admin-border)] pt-3">
                    <MemberRowActions memberId={m.id} isActive={m.isActive} />
                  </div>
                </AdminListCard>
              );
            })
          ) : (
            <AdminListCard>
              <p className="text-center text-sm text-[var(--admin-muted)]">No members match these filters.</p>
            </AdminListCard>
          )
        }
        table={
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
                      <span className={badgeClass(status)}>{statusLabel(status)}</span>
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
        }
      />
    </div>
  );
}
