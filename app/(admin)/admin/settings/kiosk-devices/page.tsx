import {
  PageHeader,
  AdminCard,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
  SubmitButton,
} from "@/components/admin/ui";
import { CopyKioskTokenButton } from "@/components/admin/CopyKioskTokenButton";
import { CreateKioskDeviceModal } from "@/components/admin/CreateKioskDeviceModal";
import { regenerateKioskToken, setKioskDeviceActive } from "../../actions";
import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

function formatWhen(date: Date | null | undefined) {
  if (!date) return "—";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function punchLabel(status: string) {
  switch (status) {
    case "PRESENT":
      return "Present";
    case "ALREADY_MARKED":
      return "Already marked";
    case "DUPLICATE":
      return "Please wait";
    case "UNKNOWN_CARD":
      return "Unknown card";
    case "INACTIVE":
      return "Inactive";
    case "EXPIRED":
      return "Expired";
    case "NO_BATCH":
      return "No batch";
    default:
      return status;
  }
}

export default async function KioskDevicesPage() {
  await requireSession();

  const [branches, devices, punches] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.kioskDevice.findMany({
      include: { branch: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attendancePunch.findMany({
      include: { member: { select: { name: true, code: true } }, branch: true, device: true },
      orderBy: { punchedAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kiosk devices"
        description="Create a device token and use it either in /kiosk or in the Windows RFID agent (%ProgramData%\\Codista\\rfid-agent). Chrome backup: chrome --kiosk https://admin.codista.in/kiosk"
        actions={
          <div className="flex flex-wrap gap-2">
            <a href="/kiosk" target="_blank" rel="noreferrer" className="btn-secondary">
              Open kiosk
            </a>
            <CreateKioskDeviceModal branches={branches.map((b) => ({ id: b.id, name: b.name }))} />
          </div>
        }
      />

      <AdminResponsiveList
        cards={
          devices.length ? (
            devices.map((d) => (
              <AdminListCard key={d.id} className={!d.isActive ? "opacity-60" : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{d.name}</p>
                    <p className="mt-0.5 text-sm text-[var(--admin-muted)]">{d.branch.name}</p>
                    <div className="mt-2">
                      {d.token ? (
                        <CopyKioskTokenButton token={d.token} />
                      ) : (
                        <form action={regenerateKioskToken}>
                          <input type="hidden" name="id" value={d.id} />
                          <SubmitButton variant="secondary" pendingLabel="Creating…">
                            Create copyable token
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                    <p className="text-xs text-[var(--admin-muted)]">Last seen {formatWhen(d.lastSeenAt)}</p>
                  </div>
                  <span className={d.isActive ? "badge-active" : "badge-inactive"}>
                    {d.isActive ? "Active" : "Revoked"}
                  </span>
                </div>
                <div className="mt-3 flex justify-end border-t border-[var(--admin-border)] pt-3">
                  <form action={setKioskDeviceActive}>
                    <input type="hidden" name="id" value={d.id} />
                    <input type="hidden" name="isActive" value={d.isActive ? "false" : "true"} />
                    <SubmitButton variant="danger" pendingLabel="Updating…">
                      {d.isActive ? "Revoke" : "Reactivate"}
                    </SubmitButton>
                  </form>
                </div>
              </AdminListCard>
            ))
          ) : (
            <AdminListCard>
              <p className="text-center text-sm text-[var(--admin-muted)]">No kiosk devices yet.</p>
            </AdminListCard>
          )
        }
        table={
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Branch</th>
                <th>Token</th>
                <th>Last seen</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className={!d.isActive ? "opacity-60" : undefined}>
                  <td className="font-medium text-gray-900">{d.name}</td>
                  <td>{d.branch.name}</td>
                  <td className="min-w-[16rem]">
                    {d.token ? (
                      <CopyKioskTokenButton token={d.token} />
                    ) : (
                      <form action={regenerateKioskToken}>
                        <input type="hidden" name="id" value={d.id} />
                        <SubmitButton variant="secondary" pendingLabel="Creating…">
                          Create copyable token
                        </SubmitButton>
                      </form>
                    )}
                  </td>
                  <td>{formatWhen(d.lastSeenAt)}</td>
                  <td>
                    <span className={d.isActive ? "badge-active" : "badge-inactive"}>
                      {d.isActive ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td>
                    <form action={setKioskDeviceActive}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="isActive" value={d.isActive ? "false" : "true"} />
                      <SubmitButton variant="danger" pendingLabel="Updating…">
                        {d.isActive ? "Revoke" : "Reactivate"}
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {!devices.length ? <AdminEmptyRow colSpan={6} message="No kiosk devices yet." /> : null}
            </tbody>
          </table>
        }
      />

      <AdminCard title="Recent punches">
        <AdminResponsiveList
          tableWrapClassName="border-0"
          cards={
            punches.length ? (
              punches.map((p) => (
                <AdminListCard key={p.id} className="!shadow-none">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {p.member ? `${p.member.name}` : "Unknown card"}
                      </p>
                      <p className="font-mono text-xs text-[var(--admin-muted)]">{p.rfidUid || "—"}</p>
                      <p className="text-xs text-[var(--admin-muted)]">
                        {p.device.name} · {p.branch.name}
                      </p>
                    </div>
                    <span className={p.status === "PRESENT" ? "badge-active" : "badge-inactive"}>
                      {punchLabel(p.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--admin-muted)]">{formatWhen(p.punchedAt)}</p>
                </AdminListCard>
              ))
            ) : (
              <AdminListCard className="!shadow-none">
                <p className="text-center text-sm text-[var(--admin-muted)]">No punches yet.</p>
              </AdminListCard>
            )
          }
          table={
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>UID</th>
                  <th>Member</th>
                  <th>Device</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {punches.map((p) => (
                  <tr key={p.id}>
                    <td>{formatWhen(p.punchedAt)}</td>
                    <td className="font-mono text-xs">{p.rfidUid || "—"}</td>
                    <td>
                      {p.member ? (
                        <>
                          {p.member.name}{" "}
                          <span className="font-mono text-xs text-[var(--admin-muted)]">
                            ({p.member.code})
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {p.device.name}
                      <p className="text-xs text-[var(--admin-muted)]">{p.branch.name}</p>
                    </td>
                    <td>{punchLabel(p.status)}</td>
                  </tr>
                ))}
                {!punches.length ? <AdminEmptyRow colSpan={5} message="No punches yet." /> : null}
              </tbody>
            </table>
          }
        />
      </AdminCard>
    </div>
  );
}
