import {
  PageHeader,
  AdminCard,
  AdminFillPage,
  AdminStickyDock,
  SubmitButton,
  AdminSelect,
  AdminDatePicker,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { getAcademySettings, membershipStatus } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { markAttendance } from "../actions";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; batchId?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireSession();
  const branchId = await getActiveBranchId(user);
  if (!branchId) {
    return (
      <div>
        <PageHeader title="Attendance" />
        <p className="text-sm text-[var(--admin-muted)]">No branch</p>
      </div>
    );
  }
  const settings = await getAcademySettings();

  const dateStr = sp.date ?? new Date().toISOString().slice(0, 10);
  const date = new Date(dateStr);

  const batches = await prisma.batch.findMany({
    where: { isActive: true, OR: [{ branchId }, { branchId: null }] },
    orderBy: { name: "asc" },
  });
  const batchId = sp.batchId ?? batches[0]?.id ?? "";

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  let roster: {
    id: string;
    name: string;
    code: string;
    status: string;
    isPresent: boolean | null;
  }[] = [];

  let sessionId: string | null = null;

  if (batchId) {
    const session = await prisma.attendanceSession.findUnique({
      where: { date_batchId_branchId: { date, batchId, branchId } },
      include: { entries: true },
    });
    sessionId = session?.id ?? null;
    const entryMap = new Map(session?.entries.map((e) => [e.memberId, e.isPresent]));

    const members = await prisma.member.findMany({
      where: {
        branchId,
        isActive: true,
        batches: { some: { batchId } },
      },
      include: { membership: true },
      orderBy: { name: "asc" },
    });

    roster = members.map((m) => ({
      id: m.id,
      name: m.name,
      code: m.code,
      status: membershipStatus(m.isActive, m.membership?.validUntil, settings.expiringSoonDays),
      isPresent: entryMap.has(m.id) ? entryMap.get(m.id)! : null,
    }));
  }

  function statusBadge(status: string) {
    if (status === "EXPIRED") return <span className="badge-expired">Expired</span>;
    if (status === "EXPIRING") return <span className="badge-expiring">Expiring</span>;
    return <span className="badge-active">{status}</span>;
  }

  function markButtons(m: (typeof roster)[number]) {
    return (
      <div className="flex gap-2">
        <form action={markAttendance}>
          <input type="hidden" name="date" value={dateStr} />
          <input type="hidden" name="batchId" value={batchId} />
          <input type="hidden" name="memberId" value={m.id} />
          <input type="hidden" name="takenById" value={user.id} />
          <input type="hidden" name="isPresent" value="true" />
          <button
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              m.isPresent === true
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700"
            }`}
            type="submit"
          >
            Present
          </button>
        </form>
        <form action={markAttendance}>
          <input type="hidden" name="date" value={dateStr} />
          <input type="hidden" name="batchId" value={batchId} />
          <input type="hidden" name="memberId" value={m.id} />
          <input type="hidden" name="takenById" value={user.id} />
          <input type="hidden" name="isPresent" value="false" />
          <button
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              m.isPresent === false
                ? "bg-[var(--admin-red)] text-white"
                : "bg-red-50 text-red-700"
            }`}
            type="submit"
          >
            Absent
          </button>
        </form>
      </div>
    );
  }

  return (
    <AdminFillPage>
      <PageHeader
        className="!mb-3"
        title="Attendance"
        description="Mark by date and batch. Roster = members mapped to that batch."
      />

      <AdminStickyDock>
        <AdminCard>
          <form className="flex flex-wrap gap-3">
            <label className="admin-label w-full md:w-auto">
              Date
              <AdminDatePicker className="mt-1 w-full md:w-auto" name="date" defaultValue={dateStr} />
            </label>
            <label className="admin-label w-full md:w-auto">
              Batch
              <AdminSelect
                className="mt-1 w-full md:min-w-[12rem] md:max-w-xs"
                name="batchId"
                defaultValue={batchId}
                options={batches.map((b) => ({ value: b.id, label: b.name }))}
              />
            </label>
            <SubmitButton className="self-end">Load roster</SubmitButton>
          </form>
        </AdminCard>
      </AdminStickyDock>

      {batchId ? (
        <>
          <AdminResponsiveList
            cards={
              roster.length ? (
                roster.map((m) => (
                  <AdminListCard key={m.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{m.name}</p>
                        <p className="font-mono text-xs text-[var(--admin-muted)]">{m.code}</p>
                      </div>
                      {statusBadge(m.status)}
                    </div>
                    <div className="mt-3 flex justify-end border-t border-[var(--admin-border)] pt-3">
                      {markButtons(m)}
                    </div>
                  </AdminListCard>
                ))
              ) : (
                <AdminListCard>
                  <p className="text-center text-sm text-[var(--admin-muted)]">
                    No members mapped to this batch.
                  </p>
                </AdminListCard>
              )
            }
            table={
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Status</th>
                    <th>Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <p className="font-medium text-gray-900">{m.name}</p>
                        <p className="font-mono text-xs text-[var(--admin-muted)]">{m.code}</p>
                      </td>
                      <td>{statusBadge(m.status)}</td>
                      <td>{markButtons(m)}</td>
                    </tr>
                  ))}
                  {!roster.length ? (
                    <AdminEmptyRow colSpan={3} message="No members mapped to this batch." />
                  ) : null}
                </tbody>
              </table>
            }
          />
          {sessionId ? (
            <p className="border border-[var(--admin-border)] bg-white px-4 py-2 text-xs text-[var(--admin-muted)]">
              Session saved. Taken by defaults to you. Users available: {users.length}.
            </p>
          ) : null}
        </>
      ) : (
        <AdminCard>
          <p className="text-sm text-[var(--admin-muted)]">Create a batch in Settings first.</p>
        </AdminCard>
      )}
    </AdminFillPage>
  );
}
