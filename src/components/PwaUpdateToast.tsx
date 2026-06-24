import { useState, useEffect } from "react";
import { RefreshCw, X } from "lucide-react";

export default function PwaUpdateToast() {
  const [show, setShow] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handleUpdateAvailable = (event: Event) => {
      const customEvent = event as CustomEvent<{ registration: ServiceWorkerRegistration }>;
      setRegistration(customEvent.detail.registration);
      setShow(true);
    };

    window.addEventListener("monty-pwa-update-available", handleUpdateAvailable);

    return () => {
      window.removeEventListener("monty-pwa-update-available", handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) return;

    // Send the message to the waiting service worker to take over
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    
    // Hide the toast immediately to feel responsive
    setShow(false);
    
    // Note: The actual reload happens via the controllerchange listener in Layout.astro
    // navigator.serviceWorker.addEventListener("controllerchange", () => {
    //   window.location.reload();
    // });
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-[#141b2d] border border-slate-800 rounded-3xl shadow-2xl p-4 flex items-center gap-4 max-w-[90vw] w-[340px]">
        {/* Animated Icon */}
        <div className="h-10 w-10 shrink-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 relative">
          <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 animate-ping opacity-20"></div>
          <RefreshCw className="h-5 w-5 animate-[spin_4s_linear_infinite]" />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-100">Versi Baru Tersedia!</p>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
            Fitur baru dan perbaikan performa telah siap digunakan.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={handleUpdate}
            className="px-3 py-1.5 rounded-xl bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] text-xs font-extrabold transition-colors"
          >
            Perbarui
          </button>
          <button
            onClick={handleDismiss}
            className="flex items-center justify-center h-6 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Tutup notifikasi"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
