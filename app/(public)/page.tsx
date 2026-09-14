import Image from "next/image";
import Link from "next/link";
import { BackgroundMotifs } from "@/components/public/BackgroundMotifs";
import { PublicFooter, PublicHeader } from "@/components/public/SiteChrome";
import { HeroBanner } from "@/components/public/HeroBanner";
import { SafeImage } from "@/components/public/SafeImage";
import { TrialForm } from "@/components/public/TrialForm";
import {
  HOME_COPY,
  HOME_LOCATIONS,
  HOME_PROGRAMS,
  HOME_SITE,
} from "@/lib/hardcoded-home";
import { getPublicSiteData } from "@/lib/public-content";

export default async function HomePage() {
  const { achievements, gallery, leadership } = await getPublicSiteData();

  const featuredAchievements = achievements.filter((a) => a.featured).slice(0, 3);
  const teaserGallery = ["TRAINING", "EVENTS", "MEDALS"]
    .map((cat) => gallery.find((g) => g.category === cat))
    .filter(Boolean);

  return (
    <div className="relative bg-paper text-ink">
      <PublicHeader />
      <main className="relative z-10">
        <HeroBanner
          kicker={HOME_COPY.heroKicker}
          headline={HOME_COPY.heroHeadline}
          subhead={HOME_COPY.heroSubhead}
        />

        <div className="relative z-0 bg-paper">
          <BackgroundMotifs local />
          <div className="paper-grain pointer-events-none absolute inset-0 z-0" />
          <div className="relative z-[1]">
          <section id="stats" className="px-4 py-12 md:px-8">
            <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
              {[
                { n: `${HOME_SITE.yearsExperience}+`, l: "Years Experience" },
                { n: `${HOME_SITE.studentsTrained}+`, l: "Students Trained" },
                { n: `${HOME_SITE.medalsWon}+`, l: "Medals Won" },
              ].map((s) => (
                <article key={s.l} className="glass-card p-6 text-center md:p-8">
                  <p className="font-display text-4xl text-crimson md:text-5xl">{s.n}</p>
                  <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-500">{s.l}</p>
                </article>
              ))}
            </div>
          </section>

          {featuredAchievements.length ? (
            <section className="px-4 py-12 md:px-8">
              <div className="mx-auto max-w-6xl">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="section-kicker">Achievements</p>
                    <h2 className="mt-3 text-3xl md:text-5xl">Proof written in medals</h2>
                  </div>
                  <Link href="/journey" className="btn-secondary shrink-0">
                    See all
                  </Link>
                </div>
                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  {featuredAchievements.map((a) => (
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
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <section id="about" className="px-4 py-12 md:px-8">
            <div className="mx-auto max-w-6xl">
              <p className="section-kicker">About Us — CODISTA</p>
              <h2 className="mt-3 max-w-3xl text-3xl md:text-5xl">{HOME_COPY.aboutHeading}</h2>
              <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(16rem,24rem)_minmax(0,1fr)] lg:gap-8">
                <figure className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/5">
                  <Image
                    src="/logo/about.jpg"
                    alt="CODISTA students and coaches in training at Coimbatore"
                    width={1024}
                    height={768}
                    className="aspect-[4/3] h-auto w-full object-cover object-center"
                  />
                </figure>
                <div className="glass-card-crimson space-y-4 p-6 md:p-10">
                  <p className="text-base leading-relaxed text-slate-700 md:text-lg">
                    {HOME_COPY.aboutBody1}
                  </p>
                  <p className="text-base leading-relaxed text-slate-700 md:text-lg">
                    {HOME_COPY.aboutBody2}
                  </p>
                  <blockquote className="border-l-4 border-gold bg-amber-50/70 px-5 py-4 text-ink">
                    {HOME_COPY.aboutQuote}
                  </blockquote>
                </div>
              </div>
            </div>
          </section>

          <section id="services" className="px-4 py-12 md:px-8">
            <div className="mx-auto max-w-6xl">
              <p className="section-kicker">Training programs</p>
              <h2 className="mt-3 text-3xl md:text-5xl">Programs for every athlete</h2>
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {HOME_PROGRAMS.map((p) => (
                  <article
                    key={p.name}
                    className={p.accent === "gold" ? "glass-card-gold p-6" : "glass-card-crimson p-6"}
                  >
                    <h3 className="text-2xl">{p.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {leadership.length ? (
            <section id="leadership" className="px-4 py-12 md:px-8">
              <div className="mx-auto max-w-6xl">
                <p className="section-kicker">Our leadership</p>
                <h2 className="mt-3 text-3xl md:text-5xl">Guided by recognised sports authorities</h2>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {leadership.map((p) => {
                    const initials = p.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("");
                    return (
                      <article key={p.id} className="glass-card p-5 text-center">
                        <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border border-gold/40 bg-paper">
                          {p.photoUrl ? (
                            <SafeImage
                              src={p.photoUrl}
                              alt={p.name}
                              wrapperClassName="h-full w-full !aspect-auto rounded-full"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gold-deep">
                              {initials}
                            </div>
                          )}
                        </div>
                        <h3 className="font-display text-base">{p.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{p.position}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {teaserGallery.length ? (
            <section className="px-4 py-12 md:px-8">
              <div className="mx-auto max-w-6xl">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="section-kicker">Our Journey</p>
                    <h2 className="mt-3 text-3xl md:text-5xl">Moments from the dojang</h2>
                  </div>
                  <Link href="/journey" className="btn-secondary">
                    Open gallery
                  </Link>
                </div>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {teaserGallery.map((g) =>
                    g ? (
                      <a
                        key={g.id}
                        href="/journey#photos"
                        className="relative overflow-hidden rounded-2xl"
                      >
                        <SafeImage src={g.src} alt={g.alt} />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 font-display text-xl text-white">
                          {g.category}
                        </span>
                      </a>
                    ) : null,
                  )}
                </div>
              </div>
            </section>
          ) : null}

          <section id="tenets" className="px-4 py-12 md:px-8">
            <div className="mx-auto max-w-6xl">
              <p className="section-kicker">Philosophy</p>
              <h2 className="mt-3 text-3xl md:text-5xl">The five tenets of Taekwondo</h2>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[
                  ["01", "Courtesy", "Respect for instructors, opponents, and the art itself."],
                  ["02", "Integrity", "Honesty in training, competition, and everyday character."],
                  ["03", "Perseverance", "The discipline to return, improve, and never quit the path."],
                  ["04", "Self-Control", "Power directed with precision — on the mat and off it."],
                  ["05", "Indomitable Spirit", "Courage that does not yield, even when the odds are steep."],
                ].map(([n, t, d], i) => (
                  <article
                    key={t}
                    className={i % 2 === 0 ? "glass-card-gold p-6" : "glass-card-crimson p-6"}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">{n}</p>
                    <h3 className="mt-3 text-xl">{t}</h3>
                    <p className="mt-2 text-sm text-slate-600">{d}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="contact" className="px-4 py-12 md:px-8">
            <div className="mx-auto max-w-6xl">
              <p className="section-kicker">Contact</p>
              <h2 className="mt-3 text-3xl md:text-5xl">{HOME_COPY.contactHeading}</h2>
              <p className="mt-4 max-w-2xl text-slate-600">{HOME_COPY.contactSubhead}</p>
              <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
                <TrialForm
                  programs={[...HOME_PROGRAMS]}
                  locations={[...HOME_LOCATIONS]}
                  whatsapp={HOME_SITE.whatsapp}
                />
                <div className="space-y-5">
                  {HOME_LOCATIONS.map((l) => (
                    <article key={l.name} className="glass-card-gold p-6 md:p-8">
                      <h3 className="text-2xl">{l.name}</h3>
                      {l.coachName ? (
                        <p className="mt-3 text-sm text-slate-600">Coach: {l.coachName}</p>
                      ) : null}
                      {l.phone ? (
                        <p className="mt-1 text-sm">
                          Contact:{" "}
                          <a
                            className="font-semibold text-crimson hover:underline"
                            href={`tel:+${l.phone.replace(/\D/g, "")}`}
                          >
                            {l.phone}
                          </a>
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm text-slate-600">{l.address}</p>
                      {l.mapUrl ? (
                        <a className="btn-secondary mt-5" href={l.mapUrl} target="_blank" rel="noreferrer">
                          Open in Maps
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
