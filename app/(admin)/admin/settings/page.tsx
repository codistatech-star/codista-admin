import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-helpers";

export default async function SettingsIndexPage() {
  await requireSession();
  // Layout already restricts to ADMIN; land on fee rules.
  redirect("/admin/settings/fee-rules");
}
