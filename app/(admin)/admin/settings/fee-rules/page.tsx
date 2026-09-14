import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { PageHeader, AdminCard, SubmitButton, AdminCheckbox } from "@/components/admin/ui";
import { FeeSlabsEditor, type FeeSlabRow } from "@/components/admin/FeeSlabsEditor";
import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { saveAcademySettings } from "../../actions";

export default async function FeeRulesPage() {
  const user = await requireSession();
  if (user.role !== Role.ADMIN) redirect("/admin/settings/class-plans");

  const settings = await prisma.academySettings.findUnique({ where: { id: "default" } });
  const slabs = (settings?.joiningFeeSlabs as FeeSlabRow[] | null) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Fee rules" description="Plan fee cutoffs, joining fee, late fines, and receipt settings" />
      <AdminCard>
        <form action={saveAcademySettings} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <label className="admin-label">
              Joining fee (₹)
              <input
                className="admin-input mt-1"
                name="joiningFee"
                type="number"
                min={0}
                step="1"
                required
                defaultValue={Number(settings?.joiningFee ?? 2000)}
              />
            </label>
            <label className="admin-label">
              Expiring soon (days)
              <input
                className="admin-input mt-1"
                name="expiringSoonDays"
                type="number"
                defaultValue={settings?.expiringSoonDays ?? 5}
              />
            </label>
            <label className="admin-label">
              Late fine (₹)
              <input
                className="admin-input mt-1"
                name="lateFineAmount"
                type="number"
                defaultValue={Number(settings?.lateFineAmount ?? 0)}
              />
            </label>
            <label className="admin-label">
              Receipt prefix
              <input
                className="admin-input mt-1"
                name="receiptPrefix"
                defaultValue={settings?.receiptPrefix ?? "COD"}
              />
            </label>
            <label className="admin-label">
              Monthly fee day
              <input
                className="admin-input mt-1"
                name="monthlyFeeDay"
                type="number"
                min={1}
                max={28}
                defaultValue={settings?.monthlyFeeDay ?? 10}
              />
            </label>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Plan fee cutoff slabs</p>
            <FeeSlabsEditor initialSlabs={slabs} />
          </div>
          <AdminCheckbox
            name="allowAttendanceWhenExpired"
            defaultChecked={settings?.allowAttendanceWhenExpired ?? true}
            label="Allow attendance when membership expired"
          />
          <div>
            <SubmitButton>Save fee rules</SubmitButton>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
