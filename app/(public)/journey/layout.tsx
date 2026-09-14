import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Journey | CODISTA",
  description:
    "Achievements, photos, and videos from Codista Taekwondo Academy in Coimbatore.",
};

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
