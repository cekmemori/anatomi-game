import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ORGAN_BY_ID, SYSTEMS } from "../data/organs";
import { idDescription, translateName } from "../data/anatomy-id";
import { useGame } from "../store/useGame";
import { Selection } from "../scenes/selection";

const DIFF = ["", "Tingkat Dasar", "Menengah", "Lanjutan"];

export default function InfoPanel({
  selection,
  onClose,
  onQuiz,
}: {
  selection: Selection | null;
  onClose: () => void;
  onQuiz: (organId: string) => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {selection?.kind === "organ" && (
        <OrganCard key={selection.id} organId={selection.id} onClose={onClose} onQuiz={onQuiz} />
      )}
      {selection?.kind === "mesh" && (
        <MeshCard key={selection.id + selection.name} sel={selection} onClose={onClose} />
      )}
    </AnimatePresence>
  );
}

const cardClass =
  "pointer-events-auto flex w-[360px] max-w-[88vw] flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-2xl shadow-black/80 backdrop-blur-xl outline-none";

const anim = {
  initial: { x: 50, opacity: 0, filter: "blur(6px)" },
  animate: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: { x: 50, opacity: 0, filter: "blur(6px)" },
  transition: { type: "spring" as const, stiffness: 280, damping: 28 },
};

function OrganCard({
  organId,
  onClose,
  onQuiz,
}: {
  organId: string;
  onClose: () => void;
  onQuiz: (organId: string) => void;
}) {
  const organ = ORGAN_BY_ID[organId];
  const discover = useGame((s) => s.discover);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (organ) discover(organ.id);
  }, [organ, discover]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  if (!organ) return null;

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      `${organ.name.id}. ${organ.description} Fungsi utama: ${organ.func}`,
    );
    u.lang = "id-ID";
    u.rate = 0.98;
    window.speechSynthesis.speak(u);
  };

  const sysColor = SYSTEMS[organ.system]?.color || "#06b6d4";

  return (
    <motion.aside
      ref={ref}
      tabIndex={-1}
      aria-labelledby="info-title"
      aria-live="polite"
      {...anim}
      className={cardClass}
    >
      {/* Dossier Header Bar */}
      <div className="relative border-b border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-xs"
              style={{
                backgroundColor: `${sysColor}25`,
                color: sysColor,
                border: `1px solid ${sysColor}50`,
              }}
            >
              {SYSTEMS[organ.system]?.icon}
            </span>
            <span className="text-xs font-semibold tracking-wide text-slate-300">
              {SYSTEMS[organ.system]?.name}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup panel detail organ"
            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-700/60 bg-slate-800/60 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <h2 id="info-title" className="font-display text-xl font-bold tracking-tight text-white">
            {organ.name.id}
          </h2>
          <span className="rounded-md border border-slate-700/80 bg-slate-800/40 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
            {DIFF[organ.difficulty]}
          </span>
        </div>
        <p className="font-mono text-[11px] text-slate-400">
          Nomenklatur: <span className="italic text-slate-300">{organ.name.en}</span>
        </p>
      </div>

      {/* Content Area */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 text-xs">
        <p className="leading-relaxed text-slate-300">
          {organ.description}
        </p>

        {/* Fisiologi / Fungsi */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            Fungsi Fisiologis
          </div>
          <p className="leading-relaxed text-slate-200">
            {organ.func}
          </p>
        </div>

        {/* Fakta Klinis & Biologis */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            <span>💡</span>
            <span>Karakteristik & Fakta Menarik</span>
          </div>
          <ul className="space-y-1.5 text-slate-300">
            {organ.facts.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-400/80">•</span>
                <span className="leading-normal">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions (Audio & Quiz) */}
        <div className="mt-2 flex gap-2 border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={speak}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 font-semibold text-slate-200 transition-all duration-150 hover:border-slate-500 hover:bg-slate-800 active:scale-[0.98]"
          >
            <span>🔊</span>
            <span>Audio Lafal</span>
          </button>
          <button
            type="button"
            onClick={() => onQuiz(organ.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cyan-400 px-3 py-2.5 font-bold text-slate-950 transition-all duration-150 hover:bg-cyan-300 hover:shadow-md hover:shadow-cyan-400/20 active:scale-[0.98]"
          >
            <span>❓</span>
            <span>Latihan Soal</span>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

function MeshCard({
  sel,
  onClose,
}: {
  sel: Extract<Selection, { kind: "mesh" }>;
  onClose: () => void;
}) {
  const isMuscle = sel.group === "muscle";
  const title = translateName(sel.name);
  const desc = idDescription(sel.name, sel.group);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${title}. ${desc}`);
    u.lang = "id-ID";
    u.rate = 0.98;
    window.speechSynthesis.speak(u);
  };

  return (
    <motion.aside
      ref={ref}
      tabIndex={-1}
      aria-labelledby="info-title"
      aria-live="polite"
      {...anim}
      className={cardClass}
    >
      <div className="relative border-b border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <span>{isMuscle ? "💪" : "🦴"}</span>
            <span>{isMuscle ? "Sistem Muskular (Otot)" : "Sistem Skeletal (Rangka)"}</span>
          </span>
          <button
            onClick={onClose}
            aria-label="Tutup panel detail"
            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-700/60 bg-slate-800/60 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        <h2 id="info-title" className="mt-2 font-display text-lg font-bold text-white">
          {title}
        </h2>
        <p className="font-mono text-[11px] text-slate-400">
          Istilah teknis: <span className="italic text-slate-300">{sel.name}</span>
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 leading-relaxed text-slate-300">
          {desc}
        </div>

        <div className="mt-auto flex gap-2 border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={speak}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 font-semibold text-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98]"
          >
            <span>🔊</span>
            <span>Lafalkan</span>
          </button>
          {sel.wiki && (
            <a
              href={sel.wiki}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3 py-2.5 font-semibold text-cyan-300 transition-all hover:bg-cyan-900/40 active:scale-[0.98]"
            >
              <span>🔗</span>
              <span>Referensi Luar</span>
            </a>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
