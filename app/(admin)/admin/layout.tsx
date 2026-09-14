import type { Metadata, Viewport } from "next";
import { Role } from "@prisma/client";
import { AdminAppShell } from "@/components/admin/AdminAppShell";
import { Providers } from "@/components/Providers";
import { getActiveBranchId, getSessionUser, listAccessibleBranches } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Codista Admin",
  description: "Codista Academy management",
  applicationName: "Codista Admin",
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Codista Admin",
    statusBarStyle: "default",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2f2a7a",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <Providers>
        <div className="admin-app min-h-dvh pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
          {children}
        </div>
      </Providers>
    );
  }

  const [branches, activeBranchId] = await Promise.all([
    listAccessibleBranches(user),
    getActiveBranchId(user),
  ]);

  return (
    <Providers>
      <AdminAppShell
        isAdmin={user.role === Role.ADMIN}
        userName={user.name}
        roleLabel={user.role === Role.ADMIN ? "Admin" : "Branch Admin"}
        branches={branches}
        activeBranchId={activeBranchId ?? undefined}
      >
        {children}
      </AdminAppShell>
    </Providers>
  );
}
