import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-helpers";

export default async function CmsIndexPage() {
  await requireSession();
  redirect("/admin/cms/achievements");
}
