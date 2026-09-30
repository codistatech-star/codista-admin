"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area } from "react-easy-crop";
import { updateMemberPhoto } from "@/app/(admin)/admin/actions";
import { getCroppedImageBlob } from "@/lib/crop-image";

export function MemberPhotoUpload({
  memberId,
  existingUrl,
}: {
  memberId: string;
  existingUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [localSrc, setLocalSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const busy = uploading || pending;
  const hasPendingImage = Boolean(localSrc);

  useEffect(() => {
    return () => {
      if (localSrc?.startsWith("blob:")) URL.revokeObjectURL(localSrc);
    };
  }, [localSrc]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function clearSelection() {
    if (localSrc?.startsWith("blob:")) URL.revokeObjectURL(localSrc);
    setLocalSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onFileChange(file: File | null) {
    setError(null);
    setMessage(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file");
      return;
    }
    if (localSrc?.startsWith("blob:")) URL.revokeObjectURL(localSrc);
    const url = URL.createObjectURL(file);
    setLocalSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  async function persistPhotoUrl(photoUrl: string | null) {
    const fd = new FormData();
    fd.set("id", memberId);
    if (photoUrl) fd.set("photoUrl", photoUrl);
    await updateMemberPhoto(fd);
  }

  async function handleSave() {
    setError(null);
    setMessage(null);
    if (!localSrc || !croppedAreaPixels) {
      setError("Choose a photo first, then align it in the frame");
      return;
    }

    setUploading(true);
    try {
      const blob = await getCroppedImageBlob(localSrc, croppedAreaPixels);
      const uploadFd = new FormData();
      uploadFd.set("folder", "members");
      uploadFd.set("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));

      const res = await fetch("/api/admin/r2-upload", {
        method: "POST",
        body: uploadFd,
      });
      const data = (await res.json()) as { publicUrl?: string; error?: string };
      if (!res.ok || !data.publicUrl) {
        throw new Error(data.error || "Upload failed");
      }

      setUploading(false);
      startTransition(async () => {
        try {
          await persistPhotoUrl(data.publicUrl!);
          clearSelection();
          setMessage("Photo saved");
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to save photo");
        }
      });
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function handleRemove() {
    setError(null);
    setMessage(null);
    clearSelection();
    startTransition(async () => {
      try {
        await persistPhotoUrl(null);
        setMessage("Photo removed");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove photo");
      }
    });
  }

  return (
    <div className="space-y-3 border-b border-[var(--admin-border)] pb-4">
      <p className="admin-label">Profile photo</p>

      {hasPendingImage ? (
        <div className="space-y-3">
          <div className="relative mx-auto h-60 w-60 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-gray-900">
            <Cropper
              image={localSrc!}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={false}
            />
          </div>
          <div className="mx-auto w-60 space-y-1">
            <label className="flex items-center gap-2 text-xs text-[var(--admin-muted)]">
              <span className="w-10 shrink-0">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                disabled={busy}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </label>
            <p className="text-xs text-[var(--admin-muted)]">
              Drag to position, zoom to frame. Upload starts only when you click Save photo.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-gray-50">
            {existingUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={existingUrl}
                alt=""
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-center text-[10px] text-[var(--admin-muted)]">
                No photo
              </div>
            )}
          </div>
          <p className="text-xs text-[var(--admin-muted)]">
            Choose an image, align it in the square frame, then Save photo.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-[var(--admin-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--admin-navy)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
          disabled={busy}
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !hasPendingImage}
            onClick={() => void handleSave()}
          >
            {uploading ? "Uploading…" : pending ? "Saving…" : "Save photo"}
          </button>
          {hasPendingImage ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={clearSelection}
            >
              Clear selection
            </button>
          ) : null}
          {existingUrl && !hasPendingImage ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={handleRemove}
            >
              Remove photo
            </button>
          ) : null}
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
    </div>
  );
}
