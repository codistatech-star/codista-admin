"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 36;

function frameUrl(index: number) {
  return `/frames/frame_${String(index).padStart(4, "0")}.webp`;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

class CanvasEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  frames: HTMLImageElement[] = [];
  lastIndex = -1;
  lastDrawn = 0;
  private _onResize: () => void;
  private _ro: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);
    this._ro = new ResizeObserver(() => this.resize());
    if (this.canvas.parentElement) this._ro.observe(this.canvas.parentElement);
    this.resize();
  }

  destroy() {
    window.removeEventListener("resize", this._onResize);
    this._ro?.disconnect();
  }

  setFrames(frames: HTMLImageElement[]) {
    this.frames = frames;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = this.canvas.parentElement;
    const width = Math.max(1, Math.round(parent?.clientWidth || window.innerWidth));
    const height = Math.max(1, Math.round(parent?.clientHeight || window.innerHeight));
    const nextW = Math.round(width * dpr);
    const nextH = Math.round(height * dpr);
    if (this.canvas.width === nextW && this.canvas.height === nextH) return;
    this.canvas.width = nextW;
    this.canvas.height = nextH;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.lastIndex = -1;
    if (this.frames.length) this.drawFrame(this.lastDrawn);
  }

  drawCover(img: HTMLImageElement) {
    const { ctx, canvas } = this;
    const cw = canvas.width;
    const ch = canvas.height;
    const imageRatio = img.width / img.height;
    const canvasRatio = cw / ch;
    let dw: number;
    let dh: number;
    let dx: number;
    let dy: number;
    if (imageRatio > canvasRatio) {
      dh = ch;
      dw = img.width * (ch / img.height);
      dx = (cw - dw) / 2;
      dy = 0;
    } else {
      dw = cw;
      dh = img.height * (cw / img.width);
      dx = 0;
      dy = (ch - dh) / 2;
    }
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  drawFrame(index: number) {
    if (!this.frames.length) return;
    const i = Math.max(0, Math.min(index, this.frames.length - 1));
    if (i === this.lastIndex) return;
    const img = this.frames[i];
    if (!img) return;
    this.lastIndex = i;
    this.lastDrawn = i;
    this.drawCover(img);
  }
}

async function preloadFrames(onProgress: (v: number) => void) {
  const urls = Array.from({ length: FRAME_COUNT }, (_, i) => frameUrl(i + 1));
  let loaded = 0;
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = () => {
            loaded += 1;
            onProgress(loaded / FRAME_COUNT);
            if (img.decode) {
              img.decode().catch(() => undefined).finally(() => resolve(img));
            } else {
              resolve(img);
            }
          };
          img.onerror = () => reject(new Error(`Failed to load ${src}`));
          img.src = src;
        }),
    ),
  );
}

type HeroBannerProps = {
  kicker: string;
  headline: string;
  subhead: string;
};

export function HeroBanner({ kicker, headline, subhead }: HeroBannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let engine: CanvasEngine | null = null;
    let tween: gsap.core.Tween | null = null;

    async function boot() {
      engine = new CanvasEngine(canvas!);
      try {
        const frames = await preloadFrames((v) => {
          if (!cancelled) setProgress(v);
        });
        if (cancelled) return;
        engine.setFrames(frames);

        const reduced = prefersReducedMotion();
        engine.drawFrame(reduced ? Math.floor((FRAME_COUNT - 1) / 2) : 0);

        if (!reduced) {
          const state = { frame: 0 };
          // Same ScrollTrigger setup as website/js/scroll-story.js
          tween = gsap.to(state, {
            frame: FRAME_COUNT - 1,
            ease: "none",
            scrollTrigger: {
              trigger: "#banner-track",
              start: "top top",
              end: "bottom bottom",
              scrub: 0.55,
              invalidateOnRefresh: true,
            },
            onUpdate: () => {
              engine?.drawFrame(Math.round(state.frame));
            },
          });

          // Recalculate after sticky + 280vh track are laid out
          requestAnimationFrame(() => {
            ScrollTrigger.refresh();
          });
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setProgress(1);
      } finally {
        if (!cancelled) {
          setReady(true);
          window.setTimeout(() => {
            setShowPreloader(false);
            ScrollTrigger.refresh();
          }, 400);
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
      engine?.destroy();
    };
  }, []);

  return (
    <>
      {showPreloader ? (
        <div
          id="preloader"
          className={`fixed inset-0 z-[80] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
            ready ? "pointer-events-none opacity-0" : ""
          }`}
          aria-busy={!ready}
        >
          <p className="font-display text-2xl tracking-[0.35em] text-ink">CODISTA</p>
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">
            Loading sequence {Math.round(progress * 100)}%
          </p>
          <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-crimson transition-transform duration-150"
              style={{ transform: `scaleX(${progress})`, transformOrigin: "left center" }}
            />
          </div>
        </div>
      ) : null}

      <section id="home" aria-label="CODISTA banner">
        {/* Tall track = scroll distance; sticky stage stays pinned while frames scrub */}
        <div id="banner-track" className="banner-track relative z-20 bg-black">
          <div
            id="banner-stage"
            className="sticky top-0 z-20 h-dvh min-h-svh overflow-hidden bg-black"
          >
            <canvas
              ref={canvasRef}
              id="kick-canvas"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full"
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-black/80 via-black/40 to-black/15" />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/70 via-transparent to-black/40" />

            <div className="relative z-10 flex h-full min-h-0 flex-col px-4 pb-10 pt-24 md:px-8 md:pt-28">
              <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col justify-center">
                <p className="inline-flex w-fit items-center rounded-full border border-gold/50 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold backdrop-blur-sm">
                  {kicker}
                </p>
                <h1 className="mt-4 max-w-3xl text-4xl leading-[1.1] text-white md:mt-5 md:text-6xl lg:text-7xl">
                  {headline}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 md:mt-5 md:text-lg">
                  {subhead}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
                  <a href="#contact" className="btn-primary">
                    Book a Free Trial Class
                  </a>
                  <a href="#services" className="btn-banner-secondary">
                    Explore Programs
                  </a>
                </div>
              </div>
              <p className="pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-[11px] uppercase tracking-[0.28em] text-white/55">
                Scroll to play the sequence
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
