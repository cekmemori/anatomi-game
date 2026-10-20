import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "../store/useSession";

export default function SessionBanner() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { joined, stage, notice, clearMessages } = useSession();

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => clearMessages(), 6000);
    return () => window.clearTimeout(t);
  }, [notice, clearMessages]);

  const onPlay = pathname === "/play";
  const showQuiz = joined && stage === "quiz" && !onPlay;

  return (
    <div
      role="region"
      aria-label="Notifikasi sesi"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
    >
      <AnimatePresence>
        {notice && (
          <motion.div
            key="notice"
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/12 bg-[#0b1220]/95 px-4 py-2.5 text-sm shadow-2xl"
          >
            <span><span aria-hidden="true">ℹ️</span> {notice}</span>
            <button
              onClick={clearMessages}
              aria-label="Tutup notifikasi"
              className="text-muted hover:text-ink"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </motion.div>
        )}
        {!notice && showQuiz && (
          <motion.button
            key="quiz"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => navigate("/play")}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-3 font-bold text-night shadow-[0_10px_40px_-8px_rgba(34,211,238,0.9)]"
          >
            🔔 Kuis dimulai! Klik untuk mengerjakan →
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
