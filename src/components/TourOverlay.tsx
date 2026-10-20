import { motion } from "framer-motion";
import { TourStep } from "../data/tour";
import { ORGAN_BY_ID } from "../data/organs";

export default function TourOverlay({
  step,
  index,
  total,
  playing,
  stepMs,
  onPrev,
  onNext,
  onToggle,
  onClose,
}: {
  step: TourStep;
  index: number;
  total: number;
  playing: boolean;
  stepMs: number;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
  onClose: () => void;
}) {
  const organ = ORGAN_BY_ID[step.organId];
  const isLast = index >= total - 1;

  return (
    <motion.div
      role="region"
      aria-label="Tur berpemandu"
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="glass-strong pointer-events-auto w-[min(680px,92vw)] overflow-hidden rounded-3xl"
    >
      <p className="sr-only" role="status" aria-live="polite">
        Bab {index + 1} dari {total}: {step.title}
      </p>
      <div aria-hidden="true" className="h-1 w-full bg-white/10">
        <motion.div
          key={`${index}-${playing}`}
          className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
          initial={{ width: playing ? "0%" : "100%" }}
          animate={{ width: playing ? "100%" : "100%" }}
          transition={{ duration: playing ? stepMs / 1000 : 0, ease: "linear" }}
        />
      </div>

      <div className="flex items-start gap-4 p-5">
        <div
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(168,85,247,0.25))",
          }}
        >
          {organ ? "🧬" : "🫀"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
              Bab {index + 1} / {total}
            </span>
            <span className="text-[11px] text-cyan-300">{organ?.name.en}</span>
          </div>
          <h3 className="font-display text-lg font-extrabold leading-tight">
            {step.title}
          </h3>
          <motion.p
            key={step.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-sm leading-relaxed text-white/80"
          >
            {step.text}
          </motion.p>
        </div>

        <button
          onClick={onClose}
          aria-label="Tutup tur"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/30 text-white/70 hover:bg-black/50"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
        <div aria-hidden="true" className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? "w-5 bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                  : i < index
                    ? "w-1.5 bg-cyan-400/60"
                    : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <NavBtn label="Bab sebelumnya" onClick={onPrev} disabled={index === 0}>
            <span aria-hidden="true">‹</span>
          </NavBtn>
          <button
            onClick={onToggle}
            aria-label={playing ? "Jeda tur" : "Putar tur"}
            aria-pressed={playing}
            className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-night shadow-[0_0_20px_-4px_rgba(34,211,238,0.9)]"
          >
            <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
          </button>
          <NavBtn label={isLast ? "Selesai" : "Bab berikutnya"} onClick={onNext} disabled={false}>
            <span aria-hidden="true">{isLast ? "✓" : "›"}</span>
          </NavBtn>
        </div>
      </div>
    </motion.div>
  );
}

function NavBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="glass grid h-10 w-10 place-items-center rounded-full text-lg font-bold transition-all hover:bg-white/10 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
