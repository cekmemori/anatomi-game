import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AnatomyScene from "../scenes/AnatomyScene";
import { ORGANS, ORGAN_BY_ID } from "../data/organs";
import { MODELED_ORGAN_IDS } from "../data/organModels";
import { useGame } from "../store/useGame";

type Phase = "idle" | "playing" | "done";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROUND_TIME = 30;
const TOTAL_ROUNDS = 8;

export default function Missions() {
  const addXp = useGame((s) => s.addXp);
  const addCoins = useGame((s) => s.addCoins);
  const discover = useGame((s) => s.discover);
  const recordMissionFinish = useGame((s) => s.recordMissionFinish);
  const toast = useGame((s) => s.toast);

  const queue = useMemo(
    () => shuffle(ORGANS.filter((o) => MODELED_ORGAN_IDS.has(o.id))).slice(0, TOTAL_ROUNDS),
    [],
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(ROUND_TIME);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [textMode, setTextMode] = useState(false);
  const lockRef = useRef(false);
  const nextTimer = useRef<number | null>(null);

  const target = queue[round];

  const next = useCallback(() => {
    setFeedback(null);
    setFlashId(null);
    lockRef.current = false;
    setRound((r) => {
      if (r + 1 >= queue.length) {
        setPhase("done");
        return r;
      }
      return r + 1;
    });
  }, [queue.length]);

  useEffect(() => {
    if (phase !== "playing") return;
    setTime(ROUND_TIME);
    lockRef.current = false;
    const t = setInterval(() => {
      setTime((v) => {
        if (v <= 1) {
          if (!lockRef.current) {
            lockRef.current = true;
            setFeedback("wrong");
            nextTimer.current = window.setTimeout(next, 1100);
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => {
      clearInterval(t);
      if (nextTimer.current !== null) {
        clearTimeout(nextTimer.current);
        nextTimer.current = null;
      }
    };
  }, [phase, round, next]);

  const onPick = (id: string) => {
    if (phase !== "playing" || lockRef.current || !target) return;
    lockRef.current = true;
    if (id === target.id) {
      const bonus = Math.round(time / 3);
      const gain = 20 + bonus;
      setScore((s) => s + gain);
      setFeedback("correct");
      setFlashId(id);
      discover(id);
      addXp(15);
      addCoins(10);
      setTimeout(next, 900);
    } else {
      setFeedback("wrong");
      setFlashId(id);
      setTimeout(() => {
        setFlashId(null);
        lockRef.current = false;
        setFeedback(null);
      }, 800);
    }
  };

  const start = () => {
    setPhase("playing");
    setRound(0);
    setScore(0);
    setFeedback(null);
    lockRef.current = false;
  };

  useEffect(() => {
    if (phase === "done") {
      recordMissionFinish(score);
      if (score > 0) {
        addXp(30);
        addCoins(25);
        toast({ icon: "🎯", title: "Misi selesai!", desc: `Skor ${score} · +30 XP` });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-4 px-4 pb-4">
      <h1 className="sr-only">Misi Temukan Organ</h1>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 shadow-sm">
          <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Ronde</span>
          <span className="font-mono text-base font-bold text-slate-100">
            {Math.min(round + (phase === "done" ? 0 : 1), TOTAL_ROUNDS)}
            <span className="text-slate-500">/{TOTAL_ROUNDS}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 shadow-sm">
          <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Skor</span>
          <span className="font-mono text-base font-bold text-cyan-300">{score}</span>
        </div>
        {phase === "playing" && (
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 shadow-sm">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Waktu</span>
            <div
              role="progressbar"
              aria-label="Sisa waktu ronde"
              aria-valuemin={0}
              aria-valuemax={ROUND_TIME}
              aria-valuenow={time}
              className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"
            >
              <motion.div
                className={`h-full rounded-full ${
                  time < 8 ? "bg-rose-500" : "bg-cyan-400"
                }`}
                animate={{ width: `${(time / ROUND_TIME) * 100}%` }}
                transition={{ ease: "linear", duration: 0.9 }}
              />
            </div>
            <span className="w-7 text-right font-mono text-xs font-bold text-slate-300" aria-label={`${time} detik tersisa`}>
              {time}s
            </span>
          </div>
        )}
        <button
          onClick={() => setTextMode((v) => !v)}
          aria-pressed={textMode}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            textMode
              ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-200"
              : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          <span aria-hidden="true">⌨️</span>
          <span>Mode Teks</span>
        </button>
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        <AnatomyScene
          mode="gltf"
          layers={{ skin: false, muscular: false, skeleton: true, organs: true }}
          selected={null}
          hovered={null}
          showLabels={false}
          showMarkers={false}
          autoRotate={phase === "idle"}
          onSelect={(s) => onPick(s.kind === "organ" ? s.id : s.name)}
        />

        {textMode && phase === "playing" && (
          <div
            role="region"
            aria-label="Pilih organ melalui daftar (mode teks)"
            className="absolute inset-x-3 bottom-3 top-24 z-10 flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl"
          >
            <p className="mb-2.5 font-mono text-xs uppercase tracking-wider text-slate-400">
              Pilih organ sasaran dari daftar:
            </p>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {ORGANS.filter((o) => MODELED_ORGAN_IDS.has(o.id)).map((o) => (
                <button
                  key={o.id}
                  onClick={() => onPick(o.id)}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-left text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/50 hover:bg-slate-800 hover:text-white"
                >
                  {o.name.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* prompt */}
        {phase === "playing" && target && (
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <motion.div
              key={target.id}
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              role="status"
              aria-live="polite"
              className="rounded-xl border border-slate-800 bg-slate-950/90 px-6 py-2.5 text-center shadow-xl backdrop-blur-xl"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Temukan &amp; Klik Organ
              </div>
              <div className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                {target.name.id}
              </div>
            </motion.div>
          </div>
        )}

        {/* feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              role="status"
              aria-live="assertive"
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <div
                className={`rounded-2xl border px-8 py-5 text-center shadow-2xl backdrop-blur-md ${
                  feedback === "correct"
                    ? "border-emerald-500/40 bg-slate-950/90 text-emerald-300"
                    : "border-rose-500/40 bg-slate-950/90 text-rose-300"
                }`}
              >
                <div className="text-4xl" aria-hidden="true">
                  {feedback === "correct" ? "✓" : "✕"}
                </div>
                <div className="mt-1 font-display text-base font-bold">
                  {feedback === "correct" ? "Identifikasi Tepat!" : "Belum Tepat"}
                </div>
                {feedback === "wrong" && flashId && ORGAN_BY_ID[flashId] && (
                  <div className="mt-1 text-xs text-slate-400">
                    Itu organ {ORGAN_BY_ID[flashId].name.id}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* overlays */}
        <AnimatePresence>
          {phase !== "playing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mission-dialog-title"
              className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-md"
            >
              <div className="w-[min(440px,90vw)] rounded-2xl border border-slate-800 bg-slate-950/95 p-8 text-center shadow-2xl backdrop-blur-2xl">
                {phase === "idle" ? (
                  <>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-3xl">
                      🎯
                    </div>
                    <h2 id="mission-dialog-title" className="mt-4 font-display text-2xl font-bold tracking-tight text-white">
                      Misi Temukan Organ 3D
                    </h2>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      Nama organ akan muncul di layar atas. Putar, zoom model 3D manusia dan klik organ yang tepat sebelum waktu habis.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1 font-mono text-xs text-cyan-300">
                      Total: {TOTAL_ROUNDS} Ronde Percobaan
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-3xl">
                      🏁
                    </div>
                    <h2 id="mission-dialog-title" className="mt-4 font-display text-2xl font-bold tracking-tight text-white">
                      Misi Selesai!
                    </h2>
                    <p className="mt-2 text-xs text-slate-400" role="status">
                      Skor pencapaian:{" "}
                      <span className="font-mono text-base font-bold text-cyan-300">
                        {score}
                      </span>
                    </p>
                    <div className="mt-3 text-xs text-slate-400">
                      {score > 200
                        ? "Luar biasa! Pengetahuan spasial anatomi Anda sangat akurat."
                        : score > 100
                          ? "Bagus sekali! Tingkatkan kecepatan pengenalan organ Anda."
                          : "Tetap semangat! Jelajahi model di Explorer untuk latihan."}
                    </div>
                  </>
                )}
                <button
                  onClick={start}
                  autoFocus
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-400/20 transition-all hover:bg-cyan-300 active:scale-[0.98]"
                >
                  <span>{phase === "idle" ? "Mulai Misi Sekarang" : "Coba Ulangi Misi"}</span>
                  <span>→</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
