import { Role } from "@prisma/client";
import {
  PageHeader,
  SubmitButton,
  AdminTableWrap,
  AdminEmptyRow,
  AdminModal,
} from "@/components/admin/ui";
import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { upsertBelt, setBeltActive } from "../../actions";

export default async function BeltsPage() {
  const user = await requireSession();
  const isAdmin = user.role === Role.ADMIN;
  const belts = await prisma.beltGrade.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Belt grades"
        description="Taekwondo belt / kup grades"
        actions={
          isAdmin ? (
            <AdminModal title="Add belt grade" trigger="Add belt">
              <form action={upsertBelt} className="space-y-3">
                <label className="admin-label">
                  Belt name
                  <input className="admin-input mt-1" name="name" placeholder="Belt name" required />
                </label>
                <label className="admin-label">
                  Sort order
                  <input className="admin-input mt-1" name="sortOrder" type="number" defaultValue={0} />
                </label>
                <SubmitButton className="w-full">Save belt</SubmitButton>
              </form>
            </AdminModal>
          ) : undefined
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
            {belts.map((b) => (
              <tr key={b.id} className={!b.isActive ? "opacity-60" : undefined}>
                <td className="font-medium text-gray-900">{b.name}</td>
                <td>{b.sortOrder}</td>
                <td>
                  <span className={b.isActive ? "badge-active" : "badge-inactive"}>
                    {b.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  {isAdmin ? (
                    <form action={setBeltActive}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="isActive" value={b.isActive ? "false" : "true"} />
                      <SubmitButton variant="danger" pendingLabel="Updating…">
                        {b.isActive ? "Deactivate" : "Activate"}
                      </SubmitButton>
                    </form>
                  ) : (
                    <span className="text-xs text-[var(--admin-muted)]">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!belts.length ? <AdminEmptyRow colSpan={4} message="No belt grades yet." /> : null}
          </tbody>
        </table>
      </AdminTableWrap>
    </div>
  );
}
