"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#e5e7eb"/>
      <text x="200" y="205" text-anchor="middle" fill="#9ca3af" font-family="system-ui,sans-serif" font-size="18">No image</text>
    </svg>`,
  );

export function SafeImage({
  src,
  alt,
  className,
  wrapperClassName,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = !src || failed ? PLACEHOLDER : src;

  return (
    <div className={cn("aspect-square overflow-hidden bg-slate-100", wrapperClassName)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolved}
        alt={alt}
        className={cn("h-full w-full object-cover object-center", className)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
