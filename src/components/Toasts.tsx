import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../store/useGame";

export default function Toasts() {
  const { toasts, dismissToast } = useGame();
  return (
    <div
      role="region"
      aria-label="Notifikasi"
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-72 flex-col gap-2"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            onClick={() => dismissToast(t.id)}
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="glass-strong pointer-events-auto flex items-center gap-3 rounded-2xl p-3 text-left shadow-xl"
          >
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/30 to-fuchsia-500/30 text-xl"
            >
              {t.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{t.title}</span>
              {t.desc && (
                <span className="block truncate text-xs text-muted">{t.desc}</span>
              )}
              <span className="sr-only">Klik untuk menutup notifikasi</span>
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
