import { PageHeader } from "@/components/admin/ui";
import { NewMemberForm } from "@/components/admin/NewMemberForm";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { getAcademySettings, type JoiningSlab } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

async function loadFormData(branchId: string) {
  const [plans, extras, batches, belts, bloodGroups, settings] = await Promise.all([
    prisma.classPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.extraClass.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.batch.findMany({
      where: { isActive: true, OR: [{ branchId }, { branchId: null }] },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.beltGrade.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.bloodGroup.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getAcademySettings(),
  ]);
  return { plans, extras, batches, belts, bloodGroups, settings };
}

export default async function NewMemberPage() {
  const user = await requireSession();
  const branchId = await getActiveBranchId(user);
  if (!branchId) {
    return (
      <div>
        <PageHeader title="Add member" />
        <p className="text-sm text-[var(--admin-muted)]">No branch</p>
      </div>
    );
  }
  const { plans, extras, batches, belts, bloodGroups, settings } = await loadFormData(branchId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add member"
        description="Create a new academy member on the current branch"
      />
      <NewMemberForm
        mode="create"
        plans={plans.map((p) => ({ id: p.id, name: p.name, fee: Number(p.fee) }))}
        extras={extras.map((e) => ({ id: e.id, name: e.name, fee: Number(e.fee) }))}
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        belts={belts.map((b) => ({ id: b.id, name: b.name }))}
        bloodGroups={bloodGroups.map((g) => ({ name: g.name }))}
        joiningFee={Number(settings.joiningFee)}
        joiningFeeSlabs={(settings.joiningFeeSlabs as JoiningSlab[]) ?? []}
      />
    </div>
  );
}
