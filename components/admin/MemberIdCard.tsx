"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { AdminModal } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export type MemberIdCardData = {
  name: string;
  code: string;
  dob: string | Date;
  mobile: string;
  fatherName: string | null;
  fatherContact: string | null;
  bloodGroup: string | null;
  photoUrl: string | null;
  branchAddress: string | null;
  branchPhone: string | null;
};

const TAGLINE = "Discipline · Respect · Excellence";

function MemberBarcode({ code }: { code: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !code) return;
    try {
      JsBarcode(svgRef.current, code, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        height: 22,
        width: 1.1,
        background: "transparent",
      });
    } catch {
      // invalid characters for CODE128 — leave empty
    }
  }, [code]);

  return (
    <div className="member-id-card__barcode" aria-hidden>
      <svg ref={svgRef} />
    </div>
  );
}

function IdCardFace({ member }: { member: MemberIdCardData }) {
  const initials = member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="member-id-card">
      <div className="member-id-card__header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/logo.jpg" alt="" className="member-id-card__logo" />
        <p className="member-id-card__brand">Codista Taekwondo Academy</p>
      </div>

      <div className="member-id-card__body">
        <div className="member-id-card__photo">
          {member.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.photoUrl} alt="" />
          ) : (
            <span>{initials || "?"}</span>
          )}
        </div>

        <div className="member-id-card__meta">
          <p className="member-id-card__name">{member.name}</p>
          <p className="member-id-card__code">{member.code}</p>
          <dl>
            <div>
              <dt>DOB</dt>
              <dd className="member-id-card__nowrap">{formatDate(member.dob)}</dd>
            </div>
            <div>
              <dt>Mobile</dt>
              <dd className="member-id-card__nowrap">{member.mobile}</dd>
            </div>
            {member.bloodGroup ? (
              <div>
                <dt>Blood</dt>
                <dd className="member-id-card__nowrap">{member.bloodGroup}</dd>
              </div>
            ) : null}
            <div className="member-id-card__emergency">
              <dt>Emergency</dt>
              <dd>
                <span className="member-id-card__emergency-name">
                  {member.fatherName || "—"}
                </span>
                {member.fatherContact ? (
                  <span className="member-id-card__emergency-phone">{member.fatherContact}</span>
                ) : null}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <MemberBarcode code={member.code} />

      <div className="member-id-card__footer">
        <p className="member-id-card__tagline">{TAGLINE}</p>
        {member.branchAddress ? (
          <p className="member-id-card__footer-line">{member.branchAddress}</p>
        ) : null}
        {member.branchPhone ? (
          <p className="member-id-card__footer-line">{member.branchPhone}</p>
        ) : null}
      </div>
    </div>
  );
}

export function MemberIdCardPrint({ member }: { member: MemberIdCardData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
        Print ID card
      </button>
      <AdminModal
        title="ID card"
        open={open}
        onOpenChange={setOpen}
        className="member-id-card-modal"
      >
        <div className="space-y-4">
          <div className="member-id-card-print-root flex justify-center bg-[var(--admin-surface)] p-4">
            <IdCardFace member={member} />
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                window.print();
              }}
            >
              Print
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <p className="text-xs text-[var(--admin-muted)] print:hidden">
            Use your printer dialog. Card size is portrait PVC (54 × 85.6 mm).
          </p>
        </div>
      </AdminModal>
    </>
  );
}
