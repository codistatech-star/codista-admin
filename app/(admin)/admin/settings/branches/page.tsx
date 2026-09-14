import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  PageHeader,
  SubmitButton,
  AdminEmptyRow,
  AdminModal,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createBranch, setBranchActive } from "../../actions";

export default async function BranchesPage() {
  const user = await requireSession();
  if (user.role !== Role.ADMIN) redirect("/admin/settings/class-plans");

  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Academy branch locations"
        actions={
          <AdminModal title="Add branch" trigger="Add branch">
            <form action={createBranch} className="space-y-3">
              <label className="admin-label">
                Branch name
                <input className="admin-input mt-1" name="name" placeholder="Branch name" required />
              </label>
              <label className="admin-label">
                Address
                <input className="admin-input mt-1" name="address" placeholder="Address" />
              </label>
              <label className="admin-label">
                Phone
                <input className="admin-input mt-1" name="phone" placeholder="Phone" />
              </label>
              <SubmitButton className="w-full">Save branch</SubmitButton>
            </form>
          </AdminModal>
        }
      />

      <AdminResponsiveList
        cards={
          branches.length ? (
            branches.map((b) => (
              <AdminListCard key={b.id} className={!b.isActive ? "opacity-60" : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{b.name}</p>
                    <p className="mt-0.5 text-sm text-[var(--admin-muted)]">{b.address ?? "—"}</p>
                    <p className="text-sm text-[var(--admin-muted)]">{b.phone ?? "—"}</p>
                  </div>
                  <span className={b.isActive ? "badge-active" : "badge-inactive"}>
                    {b.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-3 flex justify-end border-t border-[var(--admin-border)] pt-3">
                  <form action={setBranchActive}>
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
              <p className="text-center text-sm text-[var(--admin-muted)]">No branches yet.</p>
            </AdminListCard>
          )
        }
        table={
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className={!b.isActive ? "opacity-60" : undefined}>
                  <td className="font-medium text-gray-900">{b.name}</td>
                  <td>{b.address ?? "—"}</td>
                  <td>{b.phone ?? "—"}</td>
                  <td>
                    <span className={b.isActive ? "badge-active" : "badge-inactive"}>
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <form action={setBranchActive}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="isActive" value={b.isActive ? "false" : "true"} />
                      <SubmitButton variant="danger" pendingLabel="Updating…">
                        {b.isActive ? "Deactivate" : "Activate"}
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {!branches.length ? <AdminEmptyRow colSpan={5} message="No branches yet." /> : null}
            </tbody>
          </table>
        }
      />
    </div>
  );
}
