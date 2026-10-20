import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePwa } from "../store/usePwa";

export default function PwaBanner() {
  const { offlineReady, needRefresh, online, updateSW } = usePwa();
  const setOfflineReady = usePwa((s) => s.setOfflineReady);
  const setNeedRefresh = usePwa((s) => s.setNeedRefresh);
  const setOnline = usePwa((s) => s.setOnline);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [setOnline]);

  return (
    <div
      role="region"
      aria-label="Status aplikasi"
      className="pointer-events-none fixed bottom-5 left-5 z-50 flex w-72 flex-col gap-2"
    >
      <AnimatePresence>
        {!online && (
          <motion.div
            key="offline"
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-strong pointer-events-auto flex items-center gap-2 rounded-2xl px-3 py-2 text-xs"
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]"
            />
            <span className="font-semibold">Mode Offline</span>
            <span className="text-muted">— konten tersimpan tetap jalan</span>
          </motion.div>
        )}

        {needRefresh && (
          <motion.div
            key="refresh"
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-strong pointer-events-auto rounded-2xl p-3"
          >
            <div className="text-sm font-bold">Versi baru tersedia 🎉</div>
            <p className="mb-2 mt-0.5 text-xs text-muted">
              Muat ulang untuk mendapatkan pembaruan terbaru.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => updateSW?.(true)}
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-3 py-2 text-xs font-bold text-night"
              >
                Muat ulang
              </button>
              <button
                onClick={() => setNeedRefresh(false)}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"
              >
                Nanti
              </button>
            </div>
          </motion.div>
        )}

        {offlineReady && !needRefresh && online && (
          <motion.div
            key="ready"
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-strong pointer-events-auto flex items-center gap-2 rounded-2xl px-3 py-2 text-xs"
          >
            <span className="text-sm" aria-hidden="true">✅</span>
            <span className="font-semibold">Siap offline</span>
            <button
              onClick={() => setOfflineReady(false)}
              aria-label="Tutup notifikasi"
              className="ml-auto text-muted hover:text-ink"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
