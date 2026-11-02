"use client";

import { useEffect, useState } from "react";

export function PwaUpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    let registration: ServiceWorkerRegistration | null = null;

    function trackWaiting(worker: ServiceWorker | null | undefined) {
      if (!worker || cancelled) return;
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        setWaitingWorker(worker);
      }
    }

    function onUpdateFound() {
      const worker = registration?.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setWaitingWorker(worker);
        }
      });
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void registration?.update();
      }
    }

    function onFocus() {
      void registration?.update();
    }

    async function setup() {
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
        if (cancelled) return;

        trackWaiting(registration.waiting);
        registration.addEventListener("updatefound", onUpdateFound);
        void registration.update();
        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("focus", onFocus);
      } catch {
        // SW registration can fail on insecure origins or unsupported browsers.
      }
    }

    void setup();

    return () => {
      cancelled = true;
      registration?.removeEventListener("updatefound", onUpdateFound);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  function reloadWithUpdate() {
    if (!waitingWorker || reloading) return;
    setReloading(true);

    const onControllerChange = () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }

  if (!waitingWorker) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="status"
    >
      <div className="flex max-w-lg items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-white px-4 py-3 shadow-lg">
        <p className="text-sm text-gray-800">Update available</p>
        <button
          type="button"
          onClick={reloadWithUpdate}
          disabled={reloading}
          className="rounded-md bg-[var(--admin-primary,#2f2a7a)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {reloading ? "Updating…" : "Reload"}
        </button>
      </div>
    </div>
  );
}
