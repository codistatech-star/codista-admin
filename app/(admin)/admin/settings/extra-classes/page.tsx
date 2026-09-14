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
import { upsertExtraClass, setExtraClassActive } from "../../actions";

export default async function ExtraClassesPage() {
  const user = await requireSession();
  const isAdmin = user.role === Role.ADMIN;
  const extras = await prisma.extraClass.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extra classes"
        description="Add-on classes mapped to members"
        actions={
          isAdmin ? (
            <AdminModal title="Add extra class" trigger="Add extra class">
              <form action={upsertExtraClass} className="space-y-3">
                <label className="admin-label">
                  Name
                  <input className="admin-input mt-1" name="name" placeholder="Extra class" required />
                </label>
                <label className="admin-label">
                  Fee (₹)
                  <input className="admin-input mt-1" name="fee" type="number" placeholder="Fee" required />
                </label>
                <label className="admin-label">
                  Sort order
                  <input className="admin-input mt-1" name="sortOrder" type="number" defaultValue={0} />
                </label>
                <SubmitButton className="w-full">Save</SubmitButton>
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
              <th>Fee</th>
              <th>Sort</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {extras.map((p) => (
              <tr key={p.id} className={!p.isActive ? "opacity-60" : undefined}>
                <td className="font-medium text-gray-900">{p.name}</td>
                <td>₹{Number(p.fee)}</td>
                <td>{p.sortOrder}</td>
                <td>
                  <span className={p.isActive ? "badge-active" : "badge-inactive"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  {isAdmin ? (
                    <form action={setExtraClassActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="isActive" value={p.isActive ? "false" : "true"} />
                      <SubmitButton variant="danger" pendingLabel="Updating…">
                        {p.isActive ? "Deactivate" : "Activate"}
                      </SubmitButton>
                    </form>
                  ) : (
                    <span className="text-xs text-[var(--admin-muted)]">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!extras.length ? <AdminEmptyRow colSpan={5} message="No extra classes yet." /> : null}
          </tbody>
        </table>
      </AdminTableWrap>
    </div>
  );
}
