"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PIN_KEY = "codista-kiosk-pin";
const LEGACY_TOKEN_KEY = "codista-kiosk-token";
const RESET_MS = 2500;

type PunchStatus =
  | "PRESENT"
  | "ALREADY_MARKED"
  | "DUPLICATE"
  | "UNKNOWN_CARD"
  | "INACTIVE"
  | "EXPIRED"
  | "NO_BATCH"
  | "OUTSIDE_WINDOW";

type PunchResult = {
  status: PunchStatus | string;
  message: string;
  member?: { name: string; code: string; photoUrl: string | null };
};

function statusTone(status: string) {
  if (status === "PRESENT") return "ok";
  if (status === "ALREADY_MARKED" || status === "DUPLICATE") return "warn";
  return "err";
}

export function KioskScan() {
  const [pin, setPin] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pairValue, setPairValue] = useState("");
  const [pairError, setPairError] = useState<string | null>(null);
  const [clock, setClock] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PunchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    const stored = window.localStorage.getItem(PIN_KEY);
    if (stored && /^\d{4}$/.test(stored)) setPin(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    function tick() {
      setClock(
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!pin) return;
    focusInput();
    function onVis() {
      if (document.visibilityState === "visible") focusInput();
    }
    window.addEventListener("focus", focusInput);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", focusInput);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pin, focusInput]);

  function pairDevice(e: React.FormEvent) {
    e.preventDefault();
    const next = pairValue.trim();
    if (!/^\d{4}$/.test(next)) {
      setPairError("Enter the 4-digit PIN from Settings → Kiosk devices.");
      return;
    }
    window.localStorage.setItem(PIN_KEY, next);
    setPin(next);
    setPairError(null);
    setPairValue("");
  }

  function forgetDevice() {
    window.localStorage.removeItem(PIN_KEY);
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    setPin(null);
    setResult(null);
  }

  async function submitUid(raw: string) {
    const uid = raw.trim();
    if (!uid || !pin || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/kiosk/punch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pin}`,
        },
        body: JSON.stringify({ uid }),
      });
      const data = (await res.json()) as PunchResult;
      if (res.status === 401) {
        forgetDevice();
        setPairError(data.message || "Invalid or revoked device");
        return;
      }
      setResult(data);
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => {
        setResult(null);
        focusInput();
      }, RESET_MS);
    } catch {
      setResult({ status: "UNKNOWN_CARD", message: "Network error — try again" });
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => {
        setResult(null);
        focusInput();
      }, RESET_MS);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
      focusInput();
    }
  }

  if (!ready) {
    return <div className="flex min-h-dvh items-center justify-center text-white/70">Loading…</div>;
  }

  if (!pin) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">CODISTA</p>
        <h1 className="mt-2 text-3xl font-semibold">Pair this kiosk</h1>
        <p className="mt-2 text-sm text-white/70">
          Enter the 4-digit device PIN from Settings → Kiosk devices.
        </p>
        <form onSubmit={pairDevice} className="mt-6 space-y-3">
          <input
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-center font-mono text-2xl tracking-[0.35em] text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-white/40"
            value={pairValue}
            onChange={(e) => setPairValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
            inputMode="numeric"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            maxLength={4}
          />
          {pairError ? <p className="text-sm text-red-200">{pairError}</p> : null}
          <button type="submit" className="w-full rounded-xl bg-[var(--admin-red,#e31c23)] px-4 py-3 font-semibold">
            Start scanning
          </button>
        </form>
      </div>
    );
  }

  const tone = result ? statusTone(result.status) : null;

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8 text-white" onClick={focusInput}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">CODISTA attendance</p>
          <p className="mt-1 text-sm text-white/70">{clock}</p>
        </div>
        <button type="button" className="text-xs text-white/50 underline" onClick={forgetDevice}>
          Unpair
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {result ? (
          <div
            className={`w-full max-w-xl rounded-3xl px-8 py-10 ${
              tone === "ok"
                ? "bg-emerald-500"
                : tone === "warn"
                  ? "bg-amber-500"
                  : "bg-[var(--admin-red,#e31c23)]"
            }`}
          >
            {result.member?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.member.photoUrl}
                alt=""
                className="mx-auto mb-4 h-28 w-28 rounded-full object-cover ring-4 ring-white/40"
              />
            ) : result.member ? (
              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-white/20 text-3xl font-semibold">
                {result.member.name.slice(0, 1)}
              </div>
            ) : null}
            <p className="text-4xl font-semibold tracking-tight">{result.message}</p>
            {result.member ? (
              <div className="mt-3">
                <p className="text-2xl font-medium">{result.member.name}</p>
                <p className="font-mono text-sm text-white/80">{result.member.code}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-4xl font-semibold tracking-tight md:text-5xl">Please tap your card</p>
            <p className="mt-3 text-white/65">Attendance is for today&apos;s class window. No other action needed.</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        className="pointer-events-none h-px w-px overflow-hidden opacity-0"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        disabled={busy}
        aria-label="RFID card"
        onBlur={() => {
          window.setTimeout(() => {
            if (document.activeElement?.tagName === "BUTTON" || document.activeElement?.tagName === "A") {
              return;
            }
            focusInput();
          }, 50);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          submitUid(e.currentTarget.value);
        }}
      />
    </div>
  );
}
