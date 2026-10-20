import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { QUIZZES, Quiz } from "../data/quizzes";
import { ORGAN_BY_ID, SYSTEMS, SystemId } from "../data/organs";
import { useGame } from "../store/useGame";

type Phase = "intro" | "answering" | "result";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const QUESTION_COUNT = 10;

export default function QuizPage() {
  const [params] = useSearchParams();
  const organId = params.get("organ");

  const recordAnswer = useGame((s) => s.recordAnswer);
  const recordQuizFinish = useGame((s) => s.recordQuizFinish);
  const addXp = useGame((s) => s.addXp);
  const addCoins = useGame((s) => s.addCoins);
  const discover = useGame((s) => s.discover);

  const [scope, setScope] = useState<SystemId | "all">("all");
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [questions, setQuestions] = useState<Quiz[]>([]);

  const organOrgan = organId ? ORGAN_BY_ID[organId] : null;

  const availableScopes = useMemo(
    () => Object.values(SYSTEMS).filter((s) => QUIZZES.some((q) => q.system === s.id)),
    [],
  );

  const buildQuestions = () => {
    let pool: Quiz[];
    if (organOrgan) {
      const byOrgan = QUIZZES.filter((q) => q.organId === organOrgan.id);
      pool = byOrgan.length
        ? byOrgan
        : QUIZZES.filter((q) => q.system === organOrgan.system);
    } else if (scope !== "all") {
      pool = QUIZZES.filter((q) => q.system === scope);
    } else {
      pool = QUIZZES;
    }
    if (pool.length === 0) pool = QUIZZES;
    setQuestions(shuffle(pool).slice(0, Math.min(QUESTION_COUNT, pool.length)));
  };

  const start = () => {
    buildQuestions();
    setIndex(0);
    setChosen(null);
    setAnswers([]);
    setPhase("answering");
  };

  const q = questions[index];
  const advancingRef = useRef(false);
  const explanationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    advancingRef.current = false;
  }, [index, phase]);

  useEffect(() => {
    if (chosen !== null) {
      const timer = setTimeout(() => {
        explanationRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chosen]);

  const choose = (i: number) => {
    if (chosen !== null || !q) return;
    setChosen(i);
    const correct = i === q.answer;
    setAnswers((a) => [...a, correct]);
    recordAnswer(correct);
    if (q.organId) discover(q.organId);
  };

  const next = () => {
    if (advancingRef.current || chosen === null) return;
    advancingRef.current = true;
    if (index + 1 >= questions.length) {
      setPhase("result");
      const total = answers.filter(Boolean).length;
      const pct = questions.length > 0 ? Math.round((total / questions.length) * 100) : 0;
      recordQuizFinish(pct);
      if (total === questions.length) {
        addXp(40);
        addCoins(40);
      } else {
        addXp(total * 5);
      }
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
  };

  const score = answers.filter(Boolean).length;

  return (
    <div className="h-full w-full overflow-y-auto px-3.5 pb-28 pt-2 sm:px-4 sm:py-6 sm:pb-12">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-start sm:justify-center">
        <AnimatePresence mode="wait">
          {/* Intro Screen */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="my-auto w-full rounded-2xl border border-slate-800 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-800/50 bg-cyan-950/40 text-xl text-cyan-400 shadow-sm"
                  aria-hidden="true"
                >
                  ❓
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Evaluasi Kuis Anatomi
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {organOrgan
                      ? `Uji pemahaman komprehensif tentang struktur dan fungsi organ ${organOrgan.name.id}.`
                      : "Pilih cakupan materi sistem tubuh di bawah ini, lalu jawab soal pilihan ganda untuk menguji pemahaman fisiologis Anda."}
                  </p>
                </div>
              </div>

              {!organOrgan && (
                <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                  <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span>Pilih Cakupan Materi</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      10 soal acak per sesi
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <ScopeChip active={scope === "all"} onClick={() => setScope("all")}>
                      🔥 Semua Sistem
                    </ScopeChip>
                    {availableScopes.map((s) => (
                      <ScopeChip
                        key={s.id}
                        active={scope === s.id}
                        onClick={() => setScope(s.id)}
                      >
                        {s.icon} {s.name.replace("Sistem ", "")}
                      </ScopeChip>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={start}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition-all hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-400/20 active:scale-[0.98]"
              >
                <span>Mulai Sesi Kuis</span>
                <span>→</span>
              </button>
            </motion.div>
          )}

          {/* Answering Screen */}
          {phase === "answering" && q && (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="my-auto flex w-full flex-col gap-3 py-2"
            >
              {/* Progress & Header */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-sm">
                  <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">
                      Pertanyaan {index + 1} dari {questions.length}
                    </span>
                    <span className="font-mono text-cyan-400">
                      Benar: {score}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Progres kuis ${index + 1} dari ${questions.length}`}
                    aria-valuemin={0}
                    aria-valuemax={questions.length}
                    aria-valuenow={index + (chosen !== null ? 1 : 0)}
                    className="h-1.5 overflow-hidden rounded-full bg-slate-800"
                  >
                    <motion.div
                      className="h-full rounded-full bg-cyan-400"
                      animate={{
                        width: `${((index + (chosen !== null ? 1 : 0)) / questions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3 text-xs font-semibold text-slate-300 shrink-0">
                  <span>{SYSTEMS[q.system as SystemId]?.icon}</span>
                  <span className="hidden sm:inline">
                    {SYSTEMS[q.system as SystemId]?.name}
                  </span>
                </div>
              </div>

              {/* Question Card */}
              <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                <h2 className="font-display text-base font-bold leading-relaxed text-white sm:text-xl">
                  {q.prompt}
                </h2>

                {/* Multiple Choice Options */}
                <div className="mt-5 grid gap-2.5">
                  {q.options.map((opt, i) => {
                    const isAnswer = i === q.answer;
                    const isChosen = i === chosen;
                    const revealed = chosen !== null;

                    let btnStyle =
                      "border-slate-800 bg-slate-900/40 text-slate-200 hover:border-slate-700 hover:bg-slate-900/80";

                    if (revealed && isAnswer) {
                      btnStyle = "border-emerald-500/60 bg-emerald-950/50 text-emerald-200 shadow-sm";
                    } else if (revealed && isChosen) {
                      btnStyle = "border-rose-500/60 bg-rose-950/50 text-rose-200 shadow-sm";
                    } else if (revealed) {
                      btnStyle = "border-slate-850 bg-slate-950/40 text-slate-500 opacity-60";
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={revealed}
                        onClick={() => choose(i)}
                        className={`flex items-center gap-3.5 rounded-xl border px-3.5 py-3 text-left transition-all duration-150 sm:px-4 ${btnStyle}`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                            revealed && isAnswer
                              ? "bg-emerald-500 text-slate-950"
                              : revealed && isChosen
                                ? "bg-rose-500 text-white"
                                : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1 text-xs sm:text-sm font-medium leading-snug">
                          {opt}
                        </span>
                        {revealed && isAnswer && (
                          <span className="font-bold text-emerald-400">✓</span>
                        )}
                        {revealed && isChosen && !isAnswer && (
                          <span className="font-bold text-rose-400">✕</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Next Trigger */}
                <AnimatePresence>
                  {chosen !== null && (
                    <motion.div
                      ref={explanationRef}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-5 overflow-hidden"
                    >
                      <div
                        className={`rounded-xl border p-4 text-xs leading-relaxed ${
                          chosen === q.answer
                            ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-100"
                            : "border-rose-500/30 bg-rose-950/30 text-rose-100"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                          <span>{chosen === q.answer ? "✓ Jawaban Benar!" : "✕ Kurang Tepat"}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{q.explain}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => next()}
                        disabled={chosen === null}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition-all hover:bg-cyan-300 active:scale-[0.98]"
                      >
                        <span>{index + 1 >= questions.length ? "Lihat Rekap Nilai" : "Soal Berikutnya"}</span>
                        <span>→</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Result Scorecard Screen */}
          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              role="status"
              aria-live="polite"
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 p-8 text-center shadow-2xl backdrop-blur-xl"
            >
              <div className="text-5xl" aria-hidden="true">
                {score === questions.length ? "🏆" : score >= questions.length / 2 ? "🎉" : "📚"}
              </div>

              <h2 className="mt-4 font-display text-3xl font-extrabold text-white">
                Skor Akhir: {Math.round((score / questions.length) * 100)}
                <span className="text-base text-slate-500 font-normal"> / 100</span>
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Berhasil menjawab {score} dari {questions.length} pertanyaan dengan benar.
              </p>

              {/* Stats Grid */}
              <div className="mt-6 grid grid-cols-3 gap-2.5 text-left text-xs">
                <SummaryBox label="Jawaban Benar" value={score} tone="emerald" />
                <SummaryBox
                  label="Jawaban Salah"
                  value={questions.length - score}
                  tone="red"
                />
                <SummaryBox
                  label="Tingkat Akurasi"
                  value={`${Math.round((score / questions.length) * 100)}%`}
                  tone="cyan"
                />
              </div>

              {/* Actions */}
              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPhase("intro")}
                  className="flex-1 rounded-xl border border-slate-700/80 bg-slate-900/60 px-5 py-3 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98]"
                >
                  Ulangi Materi Ini
                </button>
                <button
                  type="button"
                  onClick={start}
                  className="flex-1 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-bold text-slate-950 transition-all hover:bg-cyan-300 hover:shadow-md hover:shadow-cyan-400/20 active:scale-[0.98]"
                >
                  Acak Soal Baru →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ScopeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border px-2.5 text-center text-xs font-semibold transition-all duration-150 ${
        active
          ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-200 shadow-sm"
          : "border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "emerald" | "red" | "cyan";
}) {
  const map = {
    emerald: "border-emerald-500/30 bg-emerald-950/20 text-emerald-300",
    red: "border-rose-500/30 bg-rose-950/20 text-rose-300",
    cyan: "border-cyan-500/30 bg-cyan-950/20 text-cyan-300",
  } as const;

  return (
    <div className={`rounded-xl border p-3 ${map[tone]}`}>
      <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">{label}</div>
      <div className="mt-0.5 font-mono text-xl font-bold">{value}</div>
    </div>
  );
}
