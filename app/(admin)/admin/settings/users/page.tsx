import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  PageHeader,
  SubmitButton,
  AdminEmptyRow,
  AdminModal,
  AdminCheckbox,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  createBranchAdmin,
  reactivateBranchAdmin,
  revokeBranchAdmin,
} from "../../actions";

export default async function UsersPage() {
  const user = await requireSession();
  if (user.role !== Role.ADMIN) redirect("/admin/settings/class-plans");

  const [branches, users] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: Role.BRANCH_ADMIN },
      include: { branches: { include: { branch: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Add or revoke Branch Admins. Admin account is seeded and not managed here."
        actions={
          <AdminModal title="Add Branch Admin" trigger="Add user">
            <form
              action={async (formData) => {
                "use server";
                await createBranchAdmin(formData);
              }}
              className="space-y-3"
            >
              <label className="admin-label">
                Full name
                <input className="admin-input mt-1" name="name" placeholder="Full name" required />
              </label>
              <label className="admin-label">
                Email
                <input className="admin-input mt-1" name="email" type="email" placeholder="Email" required />
              </label>
              <label className="admin-label">
                Temporary password
                <input
                  className="admin-input mt-1"
                  name="password"
                  type="password"
                  placeholder="Temporary password"
                  required
                />
              </label>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Branches</p>
                <div className="flex flex-wrap gap-3">
                  {branches.map((b) => (
                    <AdminCheckbox key={b.id} name="branchIds" value={b.id} label={b.name} />
                  ))}
                </div>
              </div>
              <SubmitButton className="w-full">Add Branch Admin</SubmitButton>
            </form>
          </AdminModal>
        }
      />

      <AdminResponsiveList
        cards={
          users.length ? (
            users.map((u) => (
              <AdminListCard key={u.id} className={!u.isActive ? "opacity-60" : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="mt-0.5 text-sm text-[var(--admin-muted)]">{u.email}</p>
                    <p className="mt-1 text-sm text-[var(--admin-muted)]">
                      {u.branches.map((b) => b.branch.name).join(", ") || "No branches"}
                    </p>
                  </div>
                  <span className={u.isActive ? "badge-active" : "badge-inactive"}>
                    {u.isActive ? "Active" : "Revoked"}
                  </span>
                </div>
                <div className="mt-3 flex justify-end border-t border-[var(--admin-border)] pt-3">
                  {u.isActive ? (
                    <form action={revokeBranchAdmin}>
                      <input type="hidden" name="id" value={u.id} />
                      <SubmitButton variant="danger" pendingLabel="Revoking…">
                        Deactivate
                      </SubmitButton>
                    </form>
                  ) : (
                    <form action={reactivateBranchAdmin}>
                      <input type="hidden" name="id" value={u.id} />
                      <SubmitButton variant="danger" pendingLabel="Reactivating…">
                        Activate
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </AdminListCard>
            ))
          ) : (
            <AdminListCard>
              <p className="text-center text-sm text-[var(--admin-muted)]">No branch admins yet.</p>
            </AdminListCard>
          )
        }
        table={
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Branches</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.isActive ? "opacity-60" : undefined}>
                  <td className="font-medium text-gray-900">{u.name}</td>
                  <td>{u.email}</td>
                  <td className="text-sm text-[var(--admin-muted)]">
                    {u.branches.map((b) => b.branch.name).join(", ") || "No branches"}
                  </td>
                  <td>
                    <span className={u.isActive ? "badge-active" : "badge-inactive"}>
                      {u.isActive ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td>
                    {u.isActive ? (
                      <form action={revokeBranchAdmin}>
                        <input type="hidden" name="id" value={u.id} />
                        <SubmitButton variant="danger" pendingLabel="Revoking…">
                          Deactivate
                        </SubmitButton>
                      </form>
                    ) : (
                      <form action={reactivateBranchAdmin}>
                        <input type="hidden" name="id" value={u.id} />
                        <SubmitButton variant="danger" pendingLabel="Reactivating…">
                          Activate
                        </SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {!users.length ? (
                <AdminEmptyRow colSpan={5} message="No branch admins yet." />
              ) : null}
            </tbody>
          </table>
        }
      />
    </div>
  );
}
