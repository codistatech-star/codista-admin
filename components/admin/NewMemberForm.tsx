"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminCard,
  AdminSelect,
  AdminDatePicker,
  AdminCheckbox,
  AdminMultiSelect,
  PhoneInput,
  SubmitButton,
  AdminModal,
} from "@/components/admin/ui";
import { CollectPaymentModal } from "@/components/admin/CollectPaymentModal";
import { saveMember } from "@/app/(admin)/admin/actions";
import { previewRegistrationFees, type JoiningSlab } from "@/lib/membership";
import { formatINR } from "@/lib/utils";

export type MemberFormOption = { id: string; name: string; fee?: number };
export type MemberFormBatch = { id: string; name: string };

export type MemberFormDefaults = {
  id?: string;
  name?: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  mobile?: string;
  address?: string;
  fatherName?: string;
  fatherContact?: string;
  institute?: string;
  schoolClass?: string;
  joiningDate?: string;
  classPlanId?: string;
  beltGradeId?: string;
  batchIds?: string[];
  extraClassIds?: string[];
};

export function NewMemberForm({
  plans,
  extras,
  batches,
  belts,
  bloodGroups,
  joiningFee,
  joiningFeeSlabs,
  defaults,
  mode = "create",
}: {
  plans: MemberFormOption[];
  extras: MemberFormOption[];
  batches: MemberFormBatch[];
  belts: MemberFormOption[];
  bloodGroups: { name: string }[];
  joiningFee: number;
  joiningFeeSlabs: JoiningSlab[];
  defaults?: MemberFormDefaults;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [classPlanId, setClassPlanId] = useState(defaults?.classPlanId ?? "");
  const [extraClassIds, setExtraClassIds] = useState<string[]>(defaults?.extraClassIds ?? []);
  const [collectOpen, setCollectOpen] = useState(false);
  const [savedMemberId, setSavedMemberId] = useState<string | null>(defaults?.id ?? null);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const preview = useMemo(() => {
    const plan = plans.find((p) => p.id === classPlanId);
    if (!plan) return null;
    const extraFees = extras
      .filter((e) => extraClassIds.includes(e.id))
      .reduce((sum, e) => sum + Number(e.fee ?? 0), 0);
    return previewRegistrationFees({
      planFee: Number(plan.fee ?? 0),
      extraFees,
      joiningFee: mode === "create" ? joiningFee : 0,
      slabs:
        mode === "create"
          ? joiningFeeSlabs
          : [{ fromDay: 1, toDay: 31, percent: 100 }],
    });
  }, [classPlanId, extraClassIds, plans, extras, joiningFee, joiningFeeSlabs, mode]);

  function validateForm(form: HTMLFormElement) {
    if (!form.reportValidity()) return false;
    const mobile = String(new FormData(form).get("mobile") || "");
    if (!/^\d{10}$/.test(mobile)) {
      setError("Mobile number must be exactly 10 digits.");
      return false;
    }
    const fatherContact = String(new FormData(form).get("fatherContact") || "");
    if (fatherContact && !/^\d{10}$/.test(fatherContact)) {
      setError("Father contact must be exactly 10 digits.");
      return false;
    }
    setError(null);
    return true;
  }

  function goToListWithSuccess(code: string) {
    setSavedCode(code);
    setSuccessOpen(true);
  }

  function handleSaveWithoutPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!validateForm(form)) return;
    const fd = new FormData(form);
    if (savedMemberId) fd.set("id", savedMemberId);
    startTransition(async () => {
      try {
        const result = await saveMember(fd);
        setSavedMemberId(result.id);
        if (mode === "edit") {
          router.refresh();
          return;
        }
        goToListWithSuccess(result.code);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save member");
      }
    });
  }

  function handleCollectPayment(e: React.MouseEvent) {
    e.preventDefault();
    const form = document.getElementById("member-form") as HTMLFormElement | null;
    if (!form || !validateForm(form)) return;
    const fd = new FormData(form);
    if (savedMemberId) fd.set("id", savedMemberId);
    startTransition(async () => {
      try {
        const result = await saveMember(fd);
        setSavedMemberId(result.id);
        setSavedCode(result.code);
        setCollectOpen(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save member");
      }
    });
  }

  const selectedBatches = new Set(defaults?.batchIds ?? []);

  return (
    <>
      <form id="member-form" onSubmit={handleSaveWithoutPayment} className="space-y-6">
        {savedMemberId ? <input type="hidden" name="id" value={savedMemberId} /> : null}

        <AdminCard title="Personal">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="admin-label">
              Name
              <input
                className="admin-input mt-1"
                name="name"
                defaultValue={defaults?.name}
                required
              />
            </label>
            <label className="admin-label">
              Gender
              <AdminSelect
                className="mt-1"
                name="gender"
                required
                defaultValue={defaults?.gender}
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
              />
            </label>
            <label className="admin-label">
              DOB
              <AdminDatePicker className="mt-1" name="dob" required defaultValue={defaults?.dob} />
            </label>
            <label className="admin-label">
              Blood group
              <AdminSelect
                className="mt-1"
                name="bloodGroup"
                placeholder="Select blood group"
                defaultValue={defaults?.bloodGroup ?? ""}
                options={bloodGroups.map((g) => ({ value: g.name, label: g.name }))}
              />
            </label>
            <PhoneInput name="mobile" label="Mobile" required defaultValue={defaults?.mobile} />
            <label className="admin-label">
              Father name
              <input
                className="admin-input mt-1"
                name="fatherName"
                defaultValue={defaults?.fatherName ?? ""}
              />
            </label>
            <PhoneInput
              name="fatherContact"
              label="Father contact number"
              defaultValue={defaults?.fatherContact}
            />
            <label className="admin-label md:col-span-2">
              Address
              <input
                className="admin-input mt-1"
                name="address"
                defaultValue={defaults?.address}
                required
              />
            </label>
          </div>
        </AdminCard>

        <AdminCard title="School">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="admin-label">
              Institute
              <input
                className="admin-input mt-1"
                name="institute"
                defaultValue={defaults?.institute ?? ""}
              />
            </label>
            <label className="admin-label">
              Class / grade
              <input
                className="admin-input mt-1"
                name="schoolClass"
                defaultValue={defaults?.schoolClass ?? ""}
              />
            </label>
          </div>
        </AdminCard>

        <AdminCard title="Academy">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="admin-label">
              Joining date
              <AdminDatePicker
                className="mt-1"
                name="joiningDate"
                required
                defaultValue={defaults?.joiningDate}
              />
            </label>
            <label className="admin-label">
              Belt
              <AdminSelect
                className="mt-1"
                name="beltGradeId"
                required
                defaultValue={defaults?.beltGradeId}
                options={belts.map((b) => ({ value: b.id, label: b.name }))}
              />
            </label>
            <label className="admin-label">
              Class plan
              <AdminSelect
                className="mt-1"
                name="classPlanId"
                required
                placeholder="Select plan"
                value={classPlanId}
                onChange={(id) => setClassPlanId(id)}
                options={plans.map((p) => ({
                  value: p.id,
                  label: `${p.name} (₹${Number(p.fee)})`,
                }))}
              />
            </label>
            <label className="admin-label">
              Extra classes
              <AdminMultiSelect
                className="mt-1"
                name="extraClassIds"
                placeholder="Select extra classes"
                value={extraClassIds}
                onChange={setExtraClassIds}
                options={extras.map((e) => ({
                  value: e.id,
                  label: `${e.name} (₹${Number(e.fee)})`,
                }))}
              />
            </label>
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-gray-700">Batches (multi)</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {batches.map((b) => (
                <AdminCheckbox
                  key={b.id}
                  name="batchIds"
                  value={b.id}
                  defaultChecked={selectedBatches.has(b.id)}
                  label={b.name}
                />
              ))}
            </div>
          </fieldset>
        </AdminCard>

        {preview ? (
          <AdminCard title="Amount summary">
            <div className="space-y-1 text-sm">
              <p>
                Plan fee: <strong>{formatINR(preview.planFee)}</strong>
                {preview.planFeeChargePercent !== 100
                  ? ` (${preview.planFeeChargePercent}% — day cutoff)`
                  : null}
              </p>
              <p>
                Extra classes: <strong>{formatINR(preview.extraFees)}</strong>
              </p>
              {mode === "create" ? (
                <p>
                  Joining fee: <strong>{formatINR(preview.joiningFee)}</strong>
                </p>
              ) : null}
              <p className="mt-2 text-base">
                Subtotal:{" "}
                <strong className="text-[var(--admin-red)]">{formatINR(preview.subtotal)}</strong>
              </p>
              <p className="text-xs text-[var(--admin-muted)]">
                Plan fee uses the day-of-month cutoff; joining fee is full. Final amount is confirmed in
                the collect payment popup.
              </p>
            </div>
          </AdminCard>
        ) : null}

        {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          {mode === "create" ? (
            <>
              <button
                type="button"
                className="btn-primary"
                disabled={pending || !classPlanId}
                onClick={handleCollectPayment}
              >
                {pending ? "Saving…" : "Collect payment"}
              </button>
              <SubmitButton variant="secondary" disabled={pending}>
                Save without payment
              </SubmitButton>
            </>
          ) : (
            <SubmitButton className="w-fit" disabled={pending}>
              Update member
            </SubmitButton>
          )}
        </div>
      </form>

      {savedMemberId ? (
        <CollectPaymentModal
          open={collectOpen}
          onOpenChange={setCollectOpen}
          memberId={savedMemberId}
          redirectAfter={false}
          onSuccess={() => {
            setCollectOpen(false);
            if (savedCode) goToListWithSuccess(savedCode);
          }}
        />
      ) : null}

      <AdminModal
        title="Registration complete"
        open={successOpen}
        onOpenChange={(open) => {
          setSuccessOpen(open);
          if (!open) {
            router.push("/admin/members");
            router.refresh();
          }
        }}
      >
        <div className="space-y-4 text-sm">
          <p className="text-gray-700">Member registered successfully.</p>
          <p>
            Student code:{" "}
            <strong className="font-mono text-base text-[var(--admin-red)]">{savedCode}</strong>
          </p>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              setSuccessOpen(false);
              router.push("/admin/members");
              router.refresh();
            }}
          >
            Go to members list
          </button>
        </div>
      </AdminModal>
    </>
  );
}
