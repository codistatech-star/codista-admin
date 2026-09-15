import Image from "next/image";
import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 bg-transparent px-3 pt-3 md:px-6">
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-black/10 md:px-5">
        <Link href="/" className="flex shrink-0 items-center pl-0.5" aria-label="CODISTA home">
          <Image
            src="/logo/logo.jpg"
            alt="CODISTA — Coimbatore District Sports Taekwondo Association"
            width={160}
            height={48}
            className="h-10 w-auto object-contain sm:h-12"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 lg:flex">
          <a className="hover:text-crimson" href="/#about">
            About
          </a>
          <a className="hover:text-crimson" href="/#services">
            Programs
          </a>
          <a className="hover:text-crimson" href="/#leadership">
            Leadership
          </a>
          <Link className="hover:text-crimson" href="/events">
            Events
          </Link>
          <Link className="hover:text-crimson" href="/journey">
            Our Journey
          </Link>
          <a className="hover:text-crimson" href="/#contact">
            Contact
          </a>
        </nav>
        <a href="/#contact" className="btn-primary hidden px-5 py-2.5 text-xs sm:inline-flex">
          Join a Free Trial
        </a>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/70 px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>© Codista Taekwondo Academy. All rights reserved.</p>
        <p>Coimbatore District Sports Taekwondo Association (CODISTA)</p>
      </div>
    </footer>
  );
}
