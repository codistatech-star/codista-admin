import { PageHeader } from "@/components/admin/ui";
import {
  CmsAddSiteEventModal,
  CmsEditSiteEventModal,
  CmsDeleteButton,
  CmsMediaCard,
} from "@/components/admin/CmsMediaForms";
import { deleteSiteEvent } from "../../cms-actions";
import { requireSession } from "@/lib/auth-helpers";
import { CMS_LIMITS } from "@/lib/cms-limits";
import { prisma } from "@/lib/prisma";

function formatEventWhen(date: Date) {
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CmsEventsPage() {
  await requireSession();
  const events = await prisma.siteEvent.findMany({
    orderBy: [{ startsAt: "asc" }, { title: "asc" }],
  });
  const remaining = Math.max(0, CMS_LIMITS.events - events.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description={`Upcoming events for the public site (${events.length}/${CMS_LIMITS.events}).`}
        actions={<CmsAddSiteEventModal disabled={remaining === 0} remaining={remaining} />}
      />

      {events.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {events.map((e) => {
            const badges = [
              e.isPublished ? "Published" : "Draft",
              e.showOnHome ? "Home" : null,
            ].filter(Boolean);
            return (
              <CmsMediaCard
                key={e.id}
                footer={
                  <>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-900">{e.title}</p>
                      <p className="truncate text-[11px] text-[var(--admin-muted)]">
                        {formatEventWhen(e.startsAt)} · {e.venue}
                      </p>
                      <p className="truncate text-[11px] text-[var(--admin-muted)]">
                        {badges.join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <CmsEditSiteEventModal event={e} />
                      <CmsDeleteButton
                        id={e.id}
                        action={deleteSiteEvent}
                        confirmMessage={`Delete “${e.title}”?`}
                        icon
                      />
                    </div>
                  </>
                }
              >
                <div className="aspect-square bg-gray-50">
                  {e.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.imageUrl}
                      alt={e.title}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-[var(--admin-muted)]">
                      No image
                    </div>
                  )}
                </div>
              </CmsMediaCard>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--admin-muted)]">No events yet. Use Add event.</p>
      )}
    </div>
  );
}
