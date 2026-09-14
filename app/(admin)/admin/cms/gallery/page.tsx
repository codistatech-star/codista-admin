import { PageHeader } from "@/components/admin/ui";
import {
  CmsAddGalleryModal,
  CmsDeleteButton,
  CmsMediaCard,
} from "@/components/admin/CmsMediaForms";
import { deleteGalleryImage } from "../../cms-actions";
import { requireSession } from "@/lib/auth-helpers";
import { CMS_LIMITS } from "@/lib/cms-limits";
import { prisma } from "@/lib/prisma";

export default async function CmsGalleryPage() {
  await requireSession();
  const gallery = await prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" } });
  const remaining = Math.max(0, CMS_LIMITS.galleryImages - gallery.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gallery"
        description={`Photo gallery for the Journey page (${gallery.length}/${CMS_LIMITS.galleryImages})`}
        actions={<CmsAddGalleryModal disabled={remaining === 0} remaining={remaining} />}
      />

      {gallery.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {gallery.map((g) => (
            <CmsMediaCard
              key={g.id}
              footer={
                <>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-gray-900">{g.alt}</p>
                    <p className="truncate text-[11px] text-[var(--admin-muted)]">
                      {g.category}
                      {g.featured ? " · Featured" : ""}
                    </p>
                  </div>
                  <CmsDeleteButton
                    id={g.id}
                    action={deleteGalleryImage}
                    confirmMessage={`Delete image “${g.alt}”?`}
                    icon
                  />
                </>
              }
            >
              <div className="aspect-square bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.alt} className="h-full w-full object-cover object-center" />
              </div>
            </CmsMediaCard>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--admin-muted)]">No images yet. Use Add image.</p>
      )}
    </div>
  );
}
