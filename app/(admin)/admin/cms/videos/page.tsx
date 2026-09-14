import { PageHeader } from "@/components/admin/ui";
import {
  CmsAddVideoModal,
  CmsDeleteButton,
  CmsMediaCard,
} from "@/components/admin/CmsMediaForms";
import { deleteVideo } from "../../cms-actions";
import { requireSession } from "@/lib/auth-helpers";
import { CMS_LIMITS } from "@/lib/cms-limits";
import { prisma } from "@/lib/prisma";

export default async function CmsVideosPage() {
  await requireSession();
  const videos = await prisma.video.findMany({ orderBy: { sortOrder: "asc" } });
  const remaining = Math.max(0, CMS_LIMITS.videos - videos.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Videos"
        description={`YouTube videos on the Journey page (${videos.length}/${CMS_LIMITS.videos})`}
        actions={<CmsAddVideoModal disabled={remaining === 0} remaining={remaining} />}
      />

      {videos.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {videos.map((v) => (
            <CmsMediaCard
              key={v.id}
              footer={
                <>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-gray-900">{v.title}</p>
                    <p className="truncate font-mono text-[11px] text-[var(--admin-muted)]">
                      {v.youtubeId}
                    </p>
                  </div>
                  <CmsDeleteButton
                    id={v.id}
                    action={deleteVideo}
                    confirmMessage={`Delete video “${v.title}”?`}
                    icon
                  />
                </>
              }
            >
              <div className="aspect-square bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                  alt={v.title}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            </CmsMediaCard>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--admin-muted)]">No videos yet. Use Add video.</p>
      )}
    </div>
  );
}
