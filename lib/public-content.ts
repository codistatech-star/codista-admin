import { prisma } from "@/lib/prisma";

/** Public CMS content (achievements, gallery, videos, leadership). */
export async function getPublicSiteData() {
  const [achievements, gallery, videos, leadership] = await Promise.all([
    prisma.achievement.findMany({
      where: { isPublished: true },
      orderBy: [{ featured: "desc" }, { year: "desc" }],
    }),
    prisma.galleryImage.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.video.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.leadershipPerson.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return { achievements, gallery, videos, leadership };
}
