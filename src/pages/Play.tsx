import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSession } from "../store/useSession";
import { SYSTEMS, SystemId } from "../data/organs";
import Countdown from "../components/Countdown";

export default function Play() {
  const navigate = useNavigate();
  const {
    connected,
    joined,
    name,
    code,
    stage,
    qIndex,
    total,
    revealed,
    qEndsAt,
    question,
    correctIndex,
    explain,
    yourAnswer,
    yourScore,
    board,
    review,
    leave,
  } = useSession();

  useEffect(() => {
    if (!joined && stage === "off") navigate("/join", { replace: true });
  }, [joined, stage, navigate]);

  if (!joined) {
    return (
      <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-2xl">
          🎟️
        </div>
        <h2 className="font-display text-lg font-bold text-white">Sesi Belum Aktif</h2>
        <p className="text-xs text-slate-400">Anda belum bergabung ke sesi live board manapun.</p>
        <Link
          to="/join"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-400/20 transition-all hover:bg-cyan-300 active:scale-[0.98]"
        >
          <span>Masuk Sesi Sekarang</span>
          <span>→</span>
        </Link>
      </div>
    );
  }

  const answered = yourAnswer !== null;
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (answered || revealed) {
      const timer = setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [answered, revealed]);

  return (
    <div className="h-full w-full overflow-y-auto px-3.5 pb-24 pt-2 sm:px-4 sm:pb-8 sm:pt-4">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
        <h1 className="sr-only">Sesi Kuis Siswa</h1>
        <div className="mb-3 flex shrink-0 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-xs shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md border border-cyan-500/30 bg-cyan-950/40 font-mono text-[11px] font-bold text-cyan-300">
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span className="font-semibold text-slate-200">{name}</span>
          </div>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="font-mono text-xs tracking-wider text-cyan-300">KODE: {code}</span>
          <span
            role="status"
            className={`ml-auto flex items-center gap-1.5 font-mono text-[11px] ${
              connected ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`}
            />
            {connected ? "Terhubung" : "Offline"}
          </span>
          <button onClick={leave} className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-400 transition-colors hover:border-slate-700 hover:text-rose-300">
            Keluar
          </button>
        </div>

        {stage === "lobby" && (
          <Card>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-3xl">
              ⏳
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">Menunggu Instruktur</h2>
            <p className="mt-2 max-w-sm text-xs text-slate-400 leading-relaxed">
              Kamu berhasil terhubung ke ruangan. Harap tunggu gurumu membuka materi belajar atau memulai pertanyaan kuis.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 font-mono text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                Siap di dalam lobby
              </span>
            </div>
          </Card>
        )}

        {stage === "study" && (
          <Card>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-3xl">
              📖
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">Waktu Belajar Mandiri</h2>
            <p className="mt-2 max-w-sm text-xs text-slate-400 leading-relaxed">
              Guru membuka sesi eksplorasi materi. Telusuri anatomi organ di Explorer 3D sebelum kuis bertempo dimulai.
            </p>
            <Link
              to="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-xs font-bold text-slate-950 shadow-md shadow-cyan-400/20 transition-all hover:bg-cyan-300 active:scale-[0.98]"
            >
              <span>🧭 Buka Anatomi 3D Explorer</span>
              <span>→</span>
            </Link>
            <p className="mt-3 text-[11px] text-slate-500">
              Pertanyaan kuis akan otomatis muncul saat guru menekan tombol mulai.
            </p>
          </Card>
        )}

        {stage === "quiz" && question && (
          <motion.div key={question.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 shadow-md">
              <div className="flex-1">
                <div className="mb-1.5 flex justify-between font-mono text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">
                    Soal {qIndex + 1} / {total}
                  </span>
                  <span className="text-cyan-300 font-bold">Skor {yourScore}</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`Progres soal ${qIndex + 1} dari ${total}`}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={qIndex + (answered ? 1 : 0)}
                  className="h-1.5 overflow-hidden rounded-full bg-slate-800"
                >
                  <motion.div
                    className="h-full rounded-full bg-cyan-400"
                    animate={{ width: `${((qIndex + (answered ? 1 : 0)) / total) * 100}%` }}
                  />
                </div>
              </div>
              <Countdown endsAt={qEndsAt} paused={revealed} compact />
              <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-300">
                {question.system ? SYSTEMS[question.system as SystemId]?.icon : "❓"}
              </span>
            </div>

            <Card>
              <h2 className="font-display text-lg font-bold text-white leading-relaxed text-left sm:text-xl">{question.prompt}</h2>
              <div className="mt-5 grid w-full gap-2.5">
                {question.options.map((opt, i) => {
                  const isAnswer = i === correctIndex;
                  const isChosen = i === yourAnswer;
                  let cls = "border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80 text-slate-200";
                  if (revealed && isAnswer) cls = "border-emerald-500/50 bg-emerald-950/30 text-emerald-300";
                  else if (revealed && isChosen) cls = "border-rose-500/50 bg-rose-950/30 text-rose-300";
                  else if (revealed) cls = "border-slate-900 bg-slate-950/40 text-slate-500 opacity-60";
                  else if (isChosen) cls = "border-cyan-400/80 bg-cyan-950/40 text-cyan-200";
                  return (
                    <button
                      key={i}
                      disabled={revealed || answered}
                      onClick={() => useSession.getState().answer(i)}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${cls}`}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-slate-700/60 bg-slate-800 font-mono text-xs font-bold text-slate-300">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1 text-xs font-medium sm:text-sm">{opt}</span>
                      {revealed && isAnswer && <span className="font-bold text-emerald-400">✓</span>}
                      {revealed && isChosen && !isAnswer && <span className="font-bold text-rose-400">✕</span>}
                    </button>
                  );
                })}
              </div>

              {answered && !revealed && (
                <div ref={feedbackRef} role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3.5 py-2 text-xs font-semibold text-cyan-300">
                  <span>✓</span>
                  <span>Jawaban tersimpan. Menunggu kunci jawaban dibuka oleh guru…</span>
                </div>
              )}

              {revealed && (
                <div
                  ref={feedbackRef}
                  role="status"
                  aria-live="polite"
                  className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left"
                >
                  <div
                    className={`text-xs font-bold ${
                      yourAnswer === correctIndex ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {yourAnswer === null
                      ? "Waktu habis / Tidak dijawab"
                      : yourAnswer === correctIndex
                        ? "✓ Jawaban Benar!"
                        : "✕ Jawaban Kurang Tepat"}
                  </div>
                  {explain && <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">{explain}</p>}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {stage === "quiz" && !question && (
          <Card>
            <div className="text-3xl" aria-hidden="true">⏳</div>
            <p className="mt-3 text-xs text-slate-400" role="status">Menyiapkan butir soal berikutnya…</p>
          </Card>
        )}

        {stage === "ended" && (
          <Card>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-3xl">
              🏁
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">Sesi Kuis Selesai</h2>
            <p className="mt-2 text-xs text-slate-400" role="status">
              Skor akhir Anda: <span className="font-mono text-base font-bold text-cyan-300">{yourScore}</span> / {total}
            </p>
            {review && review.length > 0 && (
              <div className="mt-6 w-full text-left">
                <h3 className="mb-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pembahasan Kunci Jawaban
                </h3>
                <div className="space-y-2">
                  {review.map((r) => (
                    <div
                      key={r.index}
                      className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md font-mono text-[10px] font-bold ${
                            r.correct ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {r.correct ? "✓" : "✕"}
                        </span>
                        <span className="flex-1 text-xs font-semibold text-slate-200">
                          {r.index + 1}. {r.prompt}
                        </span>
                      </div>
                      <div className="mt-2.5 space-y-1 pl-7 text-xs">
                        <div className="text-emerald-400">
                          Kunci Benar: {String.fromCharCode(65 + r.correctIndex)}.{" "}
                          {r.options[r.correctIndex]}
                        </div>
                        {!r.correct && (
                          <div className="text-rose-400">
                            Pilihan Anda:{" "}
                            {r.chosen === null
                              ? "tidak dijawab"
                              : `${String.fromCharCode(65 + r.chosen)}. ${r.options[r.chosen]}`}
                          </div>
                        )}
                        {r.explain && <div className="mt-1 text-[11px] text-slate-400">{r.explain}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {board && board.length > 0 && (
              <div className="mt-6 w-full text-left">
                <h3 className="mb-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Papan Peringkat Sesi
                </h3>
                <ol className="space-y-1.5">
                  {board.slice(0, 10).map((row, i) => {
                    const me = row.id === useSession.getState().studentId;
                    return (
                      <li
                        key={row.id}
                        className={`flex items-center gap-3 rounded-xl border px-3.5 py-2 text-xs transition-colors ${
                          me ? "border-cyan-500/40 bg-cyan-950/30 text-cyan-200" : "border-slate-800/80 bg-slate-900/40 text-slate-300"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="w-5 font-mono text-xs font-bold text-slate-500"
                        >
                          #{i + 1}
                        </span>
                        <span className="flex-1 font-medium">
                          {row.name}
                          {me ? " (Anda)" : ""}
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          <span className="sr-only">Skor </span>
                          {row.score}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      tabIndex={0}
      className={`my-auto w-full rounded-2xl border border-slate-800 bg-slate-950/90 p-5 sm:p-8 text-center shadow-xl backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
