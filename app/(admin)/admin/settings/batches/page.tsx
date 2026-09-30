import {
  PageHeader,
  SubmitButton,
  AdminEmptyRow,
  AdminFormModal,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { requireSession } from "@/lib/auth-helpers";
import { formatBatchWindow } from "@/lib/attendance";
import { prisma } from "@/lib/prisma";
import { upsertBatch, setBatchActive } from "../../actions";

export default async function BatchesPage() {
  await requireSession();
  const batches = await prisma.batch.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Training batches for attendance. Start/end times (IST) control which batch a kiosk punch marks."
        actions={
          <AdminFormModal title="Add batch" trigger="Add batch" action={upsertBatch}>
            <label className="admin-label">
              Batch name
              <input className="admin-input mt-1" name="name" placeholder="Batch name" required />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="admin-label">
                Start time (IST)
                <input className="admin-input mt-1" name="startTime" type="time" required />
              </label>
              <label className="admin-label">
                End time (IST)
                <input className="admin-input mt-1" name="endTime" type="time" required />
              </label>
            </div>
            <p className="text-xs text-[var(--admin-muted)]">Saved to the current active branch.</p>
            <SubmitButton className="w-full">Save batch</SubmitButton>
          </AdminFormModal>
        }
      />

      <AdminResponsiveList
        cards={
          batches.length ? (
            batches.map((b) => (
              <AdminListCard key={b.id} className={!b.isActive ? "opacity-60" : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{b.name}</p>
                    <p className="mt-0.5 text-sm text-[var(--admin-muted)]">
                      {formatBatchWindow(b.startTime, b.endTime) ?? "No time window set"}
                    </p>
                    <p className="text-xs text-[var(--admin-muted)]">Sort {b.sortOrder}</p>
                  </div>
                  <span className={b.isActive ? "badge-active" : "badge-inactive"}>
                    {b.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-[var(--admin-border)] pt-3">
                  <AdminFormModal
                    title="Edit batch"
                    trigger="Edit"
                    triggerClassName="btn-secondary !px-3 !py-1.5 text-xs"
                    action={upsertBatch}
                  >
                    <input type="hidden" name="id" value={b.id} />
                    <label className="admin-label">
                      Batch name
                      <input
                        className="admin-input mt-1"
                        name="name"
                        defaultValue={b.name}
                        required
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="admin-label">
                        Start time (IST)
                        <input
                          className="admin-input mt-1"
                          name="startTime"
                          type="time"
                          defaultValue={b.startTime ?? ""}
                          required
                        />
                      </label>
                      <label className="admin-label">
                        End time (IST)
                        <input
                          className="admin-input mt-1"
                          name="endTime"
                          type="time"
                          defaultValue={b.endTime ?? ""}
                          required
                        />
                      </label>
                    </div>
                    <SubmitButton className="w-full">Save batch</SubmitButton>
                  </AdminFormModal>
                  <form action={setBatchActive}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="isActive" value={b.isActive ? "false" : "true"} />
                    <SubmitButton variant="danger" pendingLabel="Updating…">
                      {b.isActive ? "Deactivate" : "Activate"}
                    </SubmitButton>
                  </form>
                </div>
              </AdminListCard>
            ))
          ) : (
            <AdminListCard>
              <p className="text-center text-sm text-[var(--admin-muted)]">No batches yet.</p>
            </AdminListCard>
          )
        }
        table={
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Window</th>
                <th>Sort</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className={!b.isActive ? "opacity-60" : undefined}>
                  <td className="font-medium text-gray-900">{b.name}</td>
                  <td className="text-sm text-[var(--admin-muted)]">
                    {formatBatchWindow(b.startTime, b.endTime) ?? "—"}
                  </td>
                  <td>{b.sortOrder}</td>
                  <td>
                    <span className={b.isActive ? "badge-active" : "badge-inactive"}>
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <AdminFormModal
                        title="Edit batch"
                        trigger="Edit"
                        triggerClassName="btn-secondary !px-3 !py-1.5 text-xs"
                        action={upsertBatch}
                      >
                        <input type="hidden" name="id" value={b.id} />
                        <label className="admin-label">
                          Batch name
                          <input
                            className="admin-input mt-1"
                            name="name"
                            defaultValue={b.name}
                            required
                          />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="admin-label">
                            Start time (IST)
                            <input
                              className="admin-input mt-1"
                              name="startTime"
                              type="time"
                              defaultValue={b.startTime ?? ""}
                              required
                            />
                          </label>
                          <label className="admin-label">
                            End time (IST)
                            <input
                              className="admin-input mt-1"
                              name="endTime"
                              type="time"
                              defaultValue={b.endTime ?? ""}
                              required
                            />
                          </label>
                        </div>
                        <SubmitButton className="w-full">Save batch</SubmitButton>
                      </AdminFormModal>
                      <form action={setBatchActive}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="isActive" value={b.isActive ? "false" : "true"} />
                        <SubmitButton variant="danger" pendingLabel="Updating…">
                          {b.isActive ? "Deactivate" : "Activate"}
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {!batches.length ? <AdminEmptyRow colSpan={5} message="No batches yet." /> : null}
            </tbody>
          </table>
        }
      />
    </div>
  );
}
