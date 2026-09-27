import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "CODISTA Kiosk",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#2f2a7a",
  width: "device-width",
  initialScale: 1,
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <div className="kiosk-app min-h-dvh">{children}</div>;
}
