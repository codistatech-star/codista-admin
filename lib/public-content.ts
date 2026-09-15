import { prisma } from "@/lib/prisma";

/** Public CMS content (achievements, gallery, videos, leadership, events). */
export async function getPublicSiteData() {
  const now = new Date();
  const [achievements, gallery, videos, leadership, events] = await Promise.all([
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
    prisma.siteEvent.findMany({
      where: { isPublished: true, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return { achievements, gallery, videos, leadership, events };
}
