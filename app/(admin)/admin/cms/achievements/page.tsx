import { PageHeader } from "@/components/admin/ui";
import {
  CmsAddAchievementModal,
  CmsDeleteButton,
  CmsMediaCard,
} from "@/components/admin/CmsMediaForms";
import { deleteAchievement } from "../../cms-actions";
import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function CmsAchievementsPage() {
  await requireSession();
  const achievements = await prisma.achievement.findMany({
    orderBy: [{ year: "desc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Achievements"
        description="Student medals and results for the Journey page"
        actions={<CmsAddAchievementModal />}
      />

      {achievements.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {achievements.map((a) => (
            <CmsMediaCard
              key={a.id}
              footer={
                <>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-gray-900">
                      {a.studentName} · {a.result}
                    </p>
                    <p className="truncate text-[11px] text-[var(--admin-muted)]">
                      {a.event} · {a.year}
                      {a.featured ? " · Featured" : ""}
                    </p>
                  </div>
                  <CmsDeleteButton
                    id={a.id}
                    action={deleteAchievement}
                    confirmMessage={`Delete achievement for ${a.studentName}?`}
                    icon
                  />
                </>
              }
            >
              <div className="aspect-square bg-gray-50">
                {a.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.photoUrl}
                    alt={a.studentName}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-[var(--admin-muted)]">
                    No photo
                  </div>
                )}
              </div>
            </CmsMediaCard>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--admin-muted)]">No achievements yet. Use Add achievement.</p>
      )}
    </div>
  );
}
