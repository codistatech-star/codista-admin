"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import html2canvas from "html2canvas-pro";
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

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}

async function inlineImages(root: HTMLElement) {
  const images = [...root.querySelectorAll("img")];
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      const absolute = new URL(src, window.location.href);
      const sameOrigin = absolute.origin === window.location.origin;
      const fetchUrl = sameOrigin
        ? `${absolute.pathname}${absolute.search}`
        : `/api/admin/media-proxy?url=${encodeURIComponent(absolute.href)}`;
      const res = await fetch(fetchUrl, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load card image");
      img.src = await blobToDataUrl(await res.blob());
    }),
  );
}

async function cardToPng(node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) throw new Error("Card is not visible");

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "0";
  host.style.top = "0";
  host.style.zIndex = "-1";
  host.style.margin = "0";
  host.style.padding = "0";
  host.style.background = "#ffffff";
  host.style.pointerEvents = "none";

  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.margin = "0";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await inlineImages(clone);
    await Promise.all(
      [...clone.querySelectorAll("img")].map((img) => img.decode().catch(() => undefined)),
    );
    const canvas = await html2canvas(clone, {
      scale: 3,
      backgroundColor: "#ffffff",
      width: rect.width,
      height: rect.height,
    });
    return canvas.toDataURL("image/png");
  } finally {
    host.remove();
  }
}

function IdCardFace({
  member,
  cardRef,
}: {
  member: MemberIdCardData;
  cardRef?: Ref<HTMLDivElement>;
}) {
  const initials = member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div ref={cardRef} className="member-id-card">
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
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  async function downloadImage() {
    const card = cardRef.current;
    if (!card || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const dataUrl = await cardToPng(card);
      const safeCode = member.code.replace(/[^\w.-]+/g, "_") || "member";
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${safeCode}-id-card.png`;
      link.click();
    } catch {
      setDownloadError("Could not create the image. Try again.");
    } finally {
      setDownloading(false);
    }
  }

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
            <IdCardFace member={member} cardRef={cardRef} />
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
            <button
              type="button"
              className="btn-secondary"
              disabled={downloading}
              onClick={() => {
                void downloadImage();
              }}
            >
              {downloading ? "Saving…" : "Download image"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          {downloadError ? (
            <p className="text-xs text-[var(--admin-red)] print:hidden">{downloadError}</p>
          ) : null}
          <p className="text-xs text-[var(--admin-muted)] print:hidden">
            Print from the dialog, or download a PNG. Card size is portrait PVC (54 × 85.6 mm).
          </p>
        </div>
      </AdminModal>
    </>
  );
}
