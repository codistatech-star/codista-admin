import {
  PageHeader,
  SubmitButton,
  AdminTableWrap,
  AdminEmptyRow,
  AdminModal,
} from "@/components/admin/ui";
import { requireSession } from "@/lib/auth-helpers";
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
        description="Training batches for attendance rosters"
        actions={
          <AdminModal title="Add batch" trigger="Add batch">
            <form action={upsertBatch} className="space-y-3">
              <label className="admin-label">
                Batch name
                <input className="admin-input mt-1" name="name" placeholder="Batch name" required />
              </label>
              <p className="text-xs text-[var(--admin-muted)]">Saved to the current active branch.</p>
              <SubmitButton className="w-full">Save batch</SubmitButton>
            </form>
          </AdminModal>
        }
      />

      <AdminTableWrap>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Sort</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id} className={!b.isActive ? "opacity-60" : undefined}>
                <td className="font-medium text-gray-900">{b.name}</td>
                <td>{b.sortOrder}</td>
                <td>
                  <span className={b.isActive ? "badge-active" : "badge-inactive"}>
                    {b.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <form action={setBatchActive}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="isActive" value={b.isActive ? "false" : "true"} />
                    <SubmitButton variant="danger" pendingLabel="Updating…">
                      {b.isActive ? "Deactivate" : "Activate"}
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {!batches.length ? <AdminEmptyRow colSpan={4} message="No batches yet." /> : null}
          </tbody>
        </table>
      </AdminTableWrap>
    </div>
  );
}
