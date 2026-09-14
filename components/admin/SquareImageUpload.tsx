"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_EDGE = 1600;

async function cropToSquareBlob(file: File): Promise<{ blob: Blob; contentType: string }> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const sx = Math.floor((bitmap.width - size) / 2);
  const sy = Math.floor((bitmap.height - size) / 2);
  const out = Math.min(size, MAX_EDGE);

  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, out, out);
  bitmap.close();

  const contentType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))),
      contentType,
      0.9,
    );
  });
  return { blob, contentType };
}

export function SquareImageUpload({
  folder,
  name = "photoUrl",
  label = "Photo",
  required,
  className,
  existingUrl,
}: {
  folder: "achievements" | "gallery" | "leadership";
  name?: string;
  label?: string;
  required?: boolean;
  className?: string;
  /** Keep current photo on edit unless a new file is chosen. */
  existingUrl?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const [publicUrl, setPublicUrl] = useState(existingUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChange(file: File | null) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file");
      return;
    }

    setUploading(true);
    try {
      const { blob, contentType } = await cropToSquareBlob(file);
      const localUrl = URL.createObjectURL(blob);
      setPreview(localUrl);

      const fd = new FormData();
      fd.set("folder", folder);
      fd.set("file", new File([blob], "upload.jpg", { type: contentType }));

      const res = await fetch("/api/admin/r2-upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { publicUrl?: string; error?: string };
      if (!res.ok || !data.publicUrl) {
        throw new Error(data.error || "Upload failed");
      }

      setPublicUrl(data.publicUrl);
    } catch (err) {
      setPublicUrl(existingUrl ?? "");
      setPreview(existingUrl ?? null);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input type="hidden" name={name} value={publicUrl} required={required} />
      <p className="admin-label">{label}</p>
      <div className="flex items-start gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-gray-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover object-center" />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-[10px] text-[var(--admin-muted)]">
              Square
              <br />
              preview
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-[var(--admin-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--admin-navy)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            disabled={uploading}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-[var(--admin-muted)]">
            Image is cropped to a square center crop (max 1600px) before upload.
          </p>
          {uploading ? <p className="text-xs text-[var(--admin-navy)]">Uploading…</p> : null}
          {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
