import { PageHeader } from "@/components/admin/ui";
import {
  CmsAddLeadershipModal,
  CmsEditLeadershipModal,
  CmsDeleteButton,
  CmsMediaCard,
} from "@/components/admin/CmsMediaForms";
import { deleteLeadershipPerson } from "../../cms-actions";
import { requireSession } from "@/lib/auth-helpers";
import { CMS_LIMITS } from "@/lib/cms-limits";
import { prisma } from "@/lib/prisma";

export default async function CmsLeadershipPage() {
  await requireSession();
  const people = await prisma.leadershipPerson.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const remaining = Math.max(0, CMS_LIMITS.leadership - people.length);
  const nextSortOrder = people.reduce((max, p) => Math.max(max, p.sortOrder), 0) + 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leadership"
        description={`Home page leadership photos (${people.length}/${CMS_LIMITS.leadership}). Sorted by sort order.`}
        actions={
          <CmsAddLeadershipModal
            disabled={remaining === 0}
            remaining={remaining}
            nextSortOrder={nextSortOrder}
          />
        }
      />

      {people.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {people.map((p) => (
            <CmsMediaCard
              key={p.id}
              footer={
                <>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-gray-900">{p.name}</p>
                    <p className="truncate text-[11px] text-[var(--admin-muted)]">
                      {p.position} · #{p.sortOrder}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <CmsEditLeadershipModal person={p} />
                    <CmsDeleteButton
                      id={p.id}
                      action={deleteLeadershipPerson}
                      confirmMessage={`Delete “${p.name}”?`}
                      icon
                    />
                  </div>
                </>
              }
            >
              <div className="relative aspect-square bg-gray-50">
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photoUrl}
                    alt={p.name}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-[var(--admin-muted)]">
                    No photo
                  </div>
                )}
                <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  #{p.sortOrder}
                </span>
              </div>
            </CmsMediaCard>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--admin-muted)]">No leadership yet. Use Add person.</p>
      )}
    </div>
  );
}
