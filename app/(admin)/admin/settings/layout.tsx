import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-helpers";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();
  if (user.role !== Role.ADMIN) {
    redirect("/admin/dashboard");
  }
  return children;
}
