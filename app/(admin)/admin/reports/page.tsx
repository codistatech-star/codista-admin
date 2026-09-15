import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-helpers";

export default async function ReportsIndexPage() {
  await requireSession();
  redirect("/admin/reports/cashflow");
}
