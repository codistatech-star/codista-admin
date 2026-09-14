import { Role } from "@prisma/client";
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
import { upsertClassPlan, setClassPlanActive } from "../../actions";

export default async function ClassPlansPage() {
  const user = await requireSession();
  const isAdmin = user.role === Role.ADMIN;
  const plans = await prisma.classPlan.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class plans"
        description="Membership plan fees (Daily, 4 days, etc.)"
        actions={
          isAdmin ? (
            <AdminModal title="Add class plan" trigger="Add plan">
              <form action={upsertClassPlan} className="space-y-3">
                <label className="admin-label">
                  Plan name
                  <input className="admin-input mt-1" name="name" placeholder="Plan name" required />
                </label>
                <label className="admin-label">
                  Fee (₹)
                  <input className="admin-input mt-1" name="fee" type="number" placeholder="Fee" required />
                </label>
                <label className="admin-label">
                  Sort order
                  <input className="admin-input mt-1" name="sortOrder" type="number" defaultValue={0} />
                </label>
                <SubmitButton className="w-full">Save plan</SubmitButton>
              </form>
            </AdminModal>
          ) : undefined
        }
      />

      <AdminResponsiveList
        cards={
          plans.length ? (
            plans.map((p) => (
              <AdminListCard key={p.id} className={!p.isActive ? "opacity-60" : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="mt-0.5 text-sm text-[var(--admin-muted)]">Sort {p.sortOrder}</p>
                  </div>
                  <span className={p.isActive ? "badge-active" : "badge-inactive"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold text-[var(--admin-navy)]">₹{Number(p.fee)}</p>
                <div className="mt-3 flex justify-end border-t border-[var(--admin-border)] pt-3">
                  {isAdmin ? (
                    <form action={setClassPlanActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="isActive" value={p.isActive ? "false" : "true"} />
                      <SubmitButton variant="danger" pendingLabel="Updating…">
                        {p.isActive ? "Deactivate" : "Activate"}
                      </SubmitButton>
                    </form>
                  ) : (
                    <span className="text-xs text-[var(--admin-muted)]">—</span>
                  )}
                </div>
              </AdminListCard>
            ))
          ) : (
            <AdminListCard>
              <p className="text-center text-sm text-[var(--admin-muted)]">No class plans yet.</p>
            </AdminListCard>
          )
        }
        table={
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
              {plans.map((p) => (
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
                      <form action={setClassPlanActive}>
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
              {!plans.length ? <AdminEmptyRow colSpan={5} message="No class plans yet." /> : null}
            </tbody>
          </table>
        }
      />
    </div>
  );
}
