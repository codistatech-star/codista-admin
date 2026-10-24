"use client";

import { useRef, useState, type Ref } from "react";
import html2canvas from "html2canvas-pro";
import { AdminModal } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export type MemberIdCardData = {
  name: string;
  code: string;
  dob: string | Date;
  fatherName: string | null;
  fatherContact: string | null;
  bloodGroup: string | null;
  photoUrl: string | null;
  branchAddress: string | null;
  branchPhone: string | null;
};

const TAGLINE = "Discipline · Respect · Excellence";
const CLUB_NAME = "Codista Academy";
const WEBSITE = "www.codista.in";
const BRAND_LINE_1 = "Coimbatore District Sports";
const BRAND_REG = "304/2011";

function KickWatermark() {
  return (
    <svg
      className="member-id-card__watermark"
      viewBox="0 0 120 160"
      aria-hidden
      focusable="false"
    >
      <g fill="#2f2a7a">
        {/* Head */}
        <circle cx="62" cy="22" r="10" />
        {/* Torso */}
        <path d="M48 34c6-2 22-2 28 0l4 28c-10 4-26 4-36 0z" />
        {/* Supporting leg */}
        <path d="M54 60l-6 48c-1 6 2 10 8 10h6c4 0 6-4 5-8l-4-50z" />
        {/* Kicking leg extended */}
        <path d="M72 58c18-8 34-4 42 6 3 4 1 9-3 10-8-6-20-8-30-4l-6-8z" />
        {/* Arms */}
        <path d="M46 40c-10 6-16 16-14 22 2 3 6 2 8-1 0-6 4-12 10-16z" />
        <path d="M78 40c8 2 14 10 12 18-1 3-5 3-7 0 0-6-2-10-8-14z" />
      </g>
    </svg>
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

  const footerContact = [member.branchPhone, WEBSITE].filter(Boolean).join(" · ");

  return (
    <div ref={cardRef} className="member-id-card">
      <KickWatermark />

      <div className="member-id-card__header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/logo.jpg" alt="" className="member-id-card__logo" />
        <p className="member-id-card__brand">
          <span>{BRAND_LINE_1}</span>
          <span className="member-id-card__brand-name">
            Taekwondo&nbsp;Association
            <span className="member-id-card__regmark" aria-hidden>
              ®
            </span>
          </span>
          <span className="member-id-card__regno">{BRAND_REG}</span>
        </p>
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

          <div className="member-id-card__facts">
            <div>
              <span className="member-id-card__caption">DOB</span>
              <span className="member-id-card__value member-id-card__nowrap">
                {formatDate(member.dob)}
              </span>
            </div>
            <div>
              <span className="member-id-card__caption">Blood</span>
              <span className="member-id-card__value member-id-card__nowrap">
                {member.bloodGroup || "—"}
              </span>
            </div>
            <div>
              <span className="member-id-card__caption">Club</span>
              <span className="member-id-card__value member-id-card__nowrap">{CLUB_NAME}</span>
            </div>
          </div>

          <div className="member-id-card__emergency">
            <span className="member-id-card__caption">Father / Mother</span>
            <span className="member-id-card__emergency-name">
              {member.fatherName || "—"}
            </span>
            {member.fatherContact ? (
              <span className="member-id-card__emergency-phone">{member.fatherContact}</span>
            ) : (
              <span className="member-id-card__emergency-phone">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="member-id-card__footer">
        <p className="member-id-card__tagline">{TAGLINE}</p>
        {member.branchAddress ? (
          <p className="member-id-card__footer-line">{member.branchAddress}</p>
        ) : null}
        {footerContact ? (
          <p className="member-id-card__footer-line">{footerContact}</p>
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
