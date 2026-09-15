import Link from "next/link";
import { BackgroundMotifs } from "@/components/public/BackgroundMotifs";
import { EventCard } from "@/components/public/EventCard";
import { PublicFooter, PublicHeader } from "@/components/public/SiteChrome";
import { getPublicSiteData } from "@/lib/public-content";

export default async function EventsPage() {
  const { events } = await getPublicSiteData();

  return (
    <div className="relative bg-paper text-ink">
      <PublicHeader />
      <BackgroundMotifs />
      <main className="relative z-10">
        <section className="relative flex min-h-[50vh] items-end bg-ink px-4 pb-14 pt-32 md:px-8">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
          <div className="relative mx-auto w-full max-w-6xl">
            <p className="inline-flex rounded-full border border-gold/50 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              Tournaments · Camps · Belt tests
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl text-white md:text-6xl">Upcoming Events</h1>
            <p className="mt-4 max-w-xl text-white/80">
              Championships, seminars, and academy milestones — register early and bring your best
              form to the mat.
            </p>
          </div>
        </section>

        <div className="relative">
          <div className="paper-grain pointer-events-none absolute inset-0 z-0" />
          <div className="relative z-[1]">
            <section className="px-4 py-14 md:px-8">
              <div className="mx-auto max-w-6xl">
                {!events.length ? (
                  <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 text-center md:p-12">
                    <p className="section-kicker">Stay tuned</p>
                    <h2 className="mt-3 text-3xl md:text-4xl">No upcoming events yet</h2>
                    <p className="mx-auto mt-4 max-w-xl text-slate-600">
                      New tournaments and academy events will appear here when published. In the
                      meantime, book a free trial class.
                    </p>
                    <Link className="btn-primary mt-6" href="/#contact">
                      Book a Free Trial
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {events.map((e) => (
                      <EventCard key={e.id} event={e} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="px-4 pb-16 md:px-8">
              <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white/70 p-8 text-center md:p-12">
                <p className="section-kicker">Next step</p>
                <h2 className="mt-3 text-3xl md:text-4xl">Begin your own journey</h2>
                <p className="mx-auto mt-4 max-w-xl text-slate-600">
                  Book a free trial class at your nearest branch. NIS-certified coaches.
                  Government-recognised certificates.
                </p>
                <Link className="btn-primary mt-6" href="/#contact">
                  Book a Free Trial
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
