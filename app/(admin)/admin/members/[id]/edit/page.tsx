import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { NewMemberForm } from "@/components/admin/NewMemberForm";
import { canAccessBranch, requireSession } from "@/lib/auth-helpers";
import { getAcademySettings, type JoiningSlab } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

export default async function MemberEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const settings = await getAcademySettings();

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      batches: true,
      extraClasses: true,
    },
  });
  if (!member || !canAccessBranch(user, member.branchId)) notFound();

  const [plans, extras, batches, belts, bloodGroups] = await Promise.all([
    prisma.classPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.extraClass.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.batch.findMany({
      where: { isActive: true, OR: [{ branchId: member.branchId }, { branchId: null }] },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.beltGrade.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.bloodGroup.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit member"
        description={`${member.name} · ${member.code}`}
        actions={
          <Link href={`/admin/members/${member.id}`} className="btn-secondary">
            Back to details
          </Link>
        }
      />

      <NewMemberForm
        mode="edit"
        plans={plans.map((p) => ({ id: p.id, name: p.name, fee: Number(p.fee) }))}
        extras={extras.map((e) => ({ id: e.id, name: e.name, fee: Number(e.fee) }))}
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        belts={belts.map((b) => ({ id: b.id, name: b.name }))}
        bloodGroups={bloodGroups.map((g) => ({ name: g.name }))}
        joiningFee={Number(settings.joiningFee)}
        joiningFeeSlabs={(settings.joiningFeeSlabs as JoiningSlab[]) ?? []}
        defaults={{
          id: member.id,
          name: member.name,
          gender: member.gender,
          dob: member.dob.toISOString().slice(0, 10),
          bloodGroup: member.bloodGroup ?? "",
          mobile: member.mobile,
          address: member.address,
          fatherName: member.fatherName ?? "",
          fatherContact: member.fatherContact ?? "",
          institute: member.institute ?? "",
          schoolClass: member.schoolClass ?? "",
          joiningDate: member.joiningDate.toISOString().slice(0, 10),
          classPlanId: member.classPlanId,
          beltGradeId: member.beltGradeId,
          batchIds: member.batches.map((b) => b.batchId),
          extraClassIds: member.extraClasses.map((e) => e.extraClassId),
          rfidUid: member.rfidUid ?? "",
        }}
      />
    </div>
  );
}
