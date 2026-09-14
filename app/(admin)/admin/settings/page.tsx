import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-helpers";

export default async function SettingsIndexPage() {
  const user = await requireSession();
  redirect(
    user.role === Role.ADMIN ? "/admin/settings/fee-rules" : "/admin/settings/class-plans",
  );
}
