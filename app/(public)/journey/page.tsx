import Link from "next/link";
import { BackgroundMotifs } from "@/components/public/BackgroundMotifs";
import { PublicFooter, PublicHeader } from "@/components/public/SiteChrome";
import { SafeImage } from "@/components/public/SafeImage";
import { getPublicSiteData } from "@/lib/public-content";

export default async function JourneyPage() {
  const { achievements, gallery, videos } = await getPublicSiteData();

  return (
    <div className="relative bg-paper text-ink">
      <PublicHeader />
      <BackgroundMotifs />
      <main className="relative z-10">
        <section className="relative flex min-h-[60vh] items-end bg-ink px-4 pb-14 pt-32 md:px-8">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
          <div className="relative mx-auto w-full max-w-6xl">
            <p className="inline-flex rounded-full border border-gold/50 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              Medals · Moments · The path
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl text-white md:text-6xl">Our Journey</h1>
            <p className="mt-4 max-w-xl text-white/80">
              Twenty years of Taekwondo in Coimbatore — championships, belt promotions, and the daily work of becoming a
              champion.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="btn-primary" href="#achievements">
                View achievements
              </a>
              <a className="btn-banner-secondary" href="#photos">
                Open gallery
              </a>
              <a className="btn-banner-secondary" href="#videos">
                Watch videos
              </a>
            </div>
          </div>
        </section>

        <div className="relative">
          <div className="paper-grain pointer-events-none absolute inset-0 z-0" />
          <div className="relative z-[1]">
        <section id="achievements" className="px-4 py-14 md:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="section-kicker">Achievements</p>
            <h2 className="mt-3 text-3xl md:text-5xl">Proof written in medals and certificates</h2>
            {!achievements.length ? (
              <p className="mt-8 text-slate-600">
                Real student achievements will appear here once published in the CMS.
              </p>
            ) : (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {achievements.map((a) => (
                  <article key={a.id} className="glass-card-gold flex h-full flex-col overflow-hidden">
                    <SafeImage src={a.photoUrl} alt={a.studentName} />
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">
                        {a.level} · {a.result}
                      </p>
                      <h3 className="mt-2 text-2xl">{a.studentName}</h3>
                      <p className="mt-1 font-medium">{a.event}</p>
                      <p className="mt-2 text-xs uppercase tracking-wider text-slate-500">
                        {a.year}
                        {a.venue ? ` · ${a.venue}` : ""}
                      </p>
                      {a.summary ? <p className="mt-3 text-sm text-slate-600">{a.summary}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="photos" className="px-4 py-14 md:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="section-kicker">Photos</p>
            <h2 className="mt-3 text-3xl md:text-5xl">Life on the mat</h2>
            {!gallery.length ? (
              <p className="mt-8 text-slate-600">Gallery photos will appear once published in the CMS.</p>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((g) => (
                  <figure
                    key={g.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <SafeImage src={g.src} alt={g.alt} />
                    <figcaption className="p-3 text-xs uppercase tracking-wider text-slate-500">
                      {g.category}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="videos" className="px-4 py-14 md:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="section-kicker">Videos</p>
            <h2 className="mt-3 text-3xl md:text-5xl">See the academy in motion</h2>
            {!videos.length ? (
              <p className="mt-8 text-slate-600">Videos will appear once published in the CMS.</p>
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {videos.map((v) => (
                  <a
                    key={v.id}
                    href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-card flex h-full flex-col overflow-hidden"
                  >
                    <div className="aspect-video overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                        alt={v.title}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-display text-lg">{v.title}</h3>
                      {v.summary ? <p className="mt-1 text-sm text-slate-600">{v.summary}</p> : null}
                    </div>
                  </a>
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
              Book a free trial class at your nearest branch. NIS-certified coaches. Government-recognised certificates.
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
