import { useState, useEffect } from "react";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function addToast(message: string, type: "success" | "error") {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    function handleEvent(e: Event) {
      const customEvent = e as CustomEvent<{ message: string; type?: "success" | "error" }>;
      const { message, type = "success" } = customEvent.detail || {};
      if (message) {
        addToast(message, type);
      }
    }

    window.addEventListener("show-toast", handleEvent);

    // Check sessionStorage for deferred notifications (e.g. after page reloads)
    try {
      const pending = sessionStorage.getItem("toast_message");
      if (pending) {
        addToast(pending, "success");
        sessionStorage.removeItem("toast_message");
      }
    } catch (err) {
      console.warn("sessionStorage access failed:", err);
    }

    return () => {
      window.removeEventListener("show-toast", handleEvent);
    };
  }, []);

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      <style>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="w-full pointer-events-auto flex items-center justify-between p-4 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-border/80 dark:border-zinc-800/80 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-300 relative overflow-hidden group"
      role="alert"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-xs font-bold text-foreground">
          {toast.message}
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded-lg hover:bg-muted/40 cursor-pointer"
        aria-label="Close"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Shimmer/Progress line at bottom */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/60 dark:bg-emerald-400/60 transition-all ease-linear"
        style={{
          width: "100%",
          animation: "shrink-width 3.5s linear forwards",
        }}
      />
    </div>
  );
}
