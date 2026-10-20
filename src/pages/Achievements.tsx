import { useState } from "react";
import { motion } from "framer-motion";
import { BADGES } from "../data/badges";
import { ORGANS, SYSTEMS } from "../data/organs";
import { computeEvaluation, useGame, xpProgress } from "../store/useGame";

export default function Achievements() {
  const {
    studentName,
    studentClass,
    loginStudent,
    logoutStudent,
    badges,
    discovered,
    totalCorrect,
    totalAnswered,
    missionsPlayed,
    missionBestScore,
    quizzesCompleted,
    quizBestScore,
    xp,
    coins,
    streak,
  } = useGame();

  const [name, setName] = useState("");
  const [kelas, setKelas] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { level, pct, next } = xpProgress(xp);
  const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const evalData = computeEvaluation({
    discoveredCount: discovered.length,
    missionBestScore,
    totalCorrect,
    totalAnswered,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await loginStudent(name, pin, kelas);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Gagal masuk.");
    } else {
      setPin("");
    }
  };

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Pencapaian"
      className="h-full overflow-y-auto px-4 pb-8"
    >
      <div className="mx-auto max-w-5xl">
        <h1 className="sr-only">Pencapaian</h1>

        {/* Kartu Login / Identitas Siswa */}
        <section
          aria-label="Identitas Evaluasi Siswa"
          className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/90 p-5 sm:p-6 shadow-xl"
        >
          {studentName ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 font-mono text-xl font-bold text-cyan-300">
                  {studentName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-white sm:text-xl">
                      {studentName}
                    </h2>
                    {studentClass && (
                      <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-0.5 font-mono text-xs text-slate-300">
                        {studentClass}
                      </span>
                    )}
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                      ✓ Tersinkron ke Evaluasi Guru
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Seluruh progres Jelajah 3D, Misi Organ, Kuis, dan Pencapaianmu tersimpan secara otomatis.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={logoutStudent}
                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-rose-300 transition-colors hover:border-rose-500/40 hover:bg-rose-950/20"
              >
                Keluar / Ganti Akun
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Otentikasi Profil Siswa</span>
                </div>
                <h2 className="mt-1 font-display text-lg font-bold text-white">
                  Masuk dengan Nama &amp; PIN Siswa
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Masukkan Nama, Kelas, dan PIN (4–8 digit angka/NISN) agar nilai evaluasi dan portofolio 3D kamu tercatat di Dashboard Guru.
                </p>
              </div>
              <form
                onSubmit={handleLogin}
                className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-[1.3fr_0.9fr_0.9fr_auto]"
              >
                <div>
                  <label htmlFor="ach-student-name" className="sr-only">
                    Nama Siswa
                  </label>
                  <input
                    id="ach-student-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={32}
                    required
                    placeholder="Nama Lengkap Siswa"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-cyan-400/80 focus:bg-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="ach-student-class" className="sr-only">
                    Kelas (Opsional)
                  </label>
                  <input
                    id="ach-student-class"
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    maxLength={24}
                    placeholder="Kelas (mis. XI MIPA 1)"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-cyan-400/80 focus:bg-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="ach-student-pin" className="sr-only">
                    PIN Siswa
                  </label>
                  <input
                    id="ach-student-pin"
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/[^A-Za-z0-9]/g, ""))
                    }
                    minLength={4}
                    maxLength={12}
                    required
                    placeholder="PIN (4–8 digit)"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 font-mono text-xs tracking-widest text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-cyan-400/80 focus:bg-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || name.trim().length < 2 || pin.trim().length < 4}
                  className="rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-400/20 transition-all hover:bg-cyan-300 active:scale-[0.98] disabled:opacity-40"
                >
                  {busy ? "Menyimpan…" : "Masuk Profil"}
                </button>
              </form>
              {error && (
                <div
                  role="alert"
                  className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3.5 py-2 text-xs text-rose-300"
                >
                  {error}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Progres Level & Statistik Utama */}
        <div className="relative mb-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="relative flex flex-wrap items-center gap-6">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-cyan-500/30 bg-cyan-950/40 font-mono text-2xl font-extrabold text-cyan-300 shadow-inner">
              Lv.{level}
            </div>
            <div className="min-w-[220px] flex-1">
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Poin Pengalaman (XP)
              </div>
              <div className="mb-2 font-mono text-2xl font-bold tracking-tight text-white">
                {xp} XP
              </div>
              <div
                role="progressbar"
                aria-label={`Progres menuju Level ${level + 1}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pct)}
                className="h-2 overflow-hidden rounded-full bg-slate-800"
              >
                <motion.div
                  className="h-full rounded-full bg-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 18 }}
                />
              </div>
              <div className="mt-1.5 font-mono text-xs text-slate-400">
                {next - xp} XP lagi menuju Level {level + 1}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Box icon="🪙" label="Koin" value={coins} />
              <Box icon="🔥" label="Streak" value={streak} />
              <Box icon="🎯" label="Akurasi" value={`${accuracy}%`} />
              <Box icon="📚" label="Soal" value={totalAnswered} />
            </div>
          </div>
        </div>

        {/* Rincian Perhitungan Evaluasi & Skor */}
        <section className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/90 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-white sm:text-lg">
                Perhitungan Nilai Evaluasi &amp; Kelulusan
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Rumus Evaluasi Standar:{" "}
                <span className="font-mono font-semibold text-slate-300">
                  30% Eksplorasi + 30% Misi 3D + 40% Kuis
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-2.5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Nilai Akhir
                </div>
                <div className="font-mono text-2xl font-bold text-cyan-300">
                  {evalData.finalScore}
                  <span className="text-xs text-slate-500">/100</span>
                </div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-slate-700 bg-slate-800 font-mono text-lg font-bold text-emerald-400">
                {evalData.grade}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>🧭 Eksplorasi 3D</span>
                <span className="font-mono font-semibold text-cyan-300">Bobot 30%</span>
              </div>
              <div className="mt-1.5 font-mono text-xl font-bold text-slate-100">
                {evalData.explorePct}%
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {discovered.length} dari {ORGANS.length} organ diidentifikasi (+25 XP per organ)
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>🎯 Misi 3D</span>
                <span className="font-mono font-semibold text-purple-300">
                  Bobot 30%
                </span>
              </div>
              <div className="mt-1.5 font-mono text-xl font-bold text-slate-100">
                {evalData.missionPct}%
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Skor terbaik {missionBestScore}/200 ({missionsPlayed}x ronde selesai)
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>❓ Akurasi Kuis</span>
                <span className="font-mono font-semibold text-emerald-300">
                  Bobot 40%
                </span>
              </div>
              <div className="mt-1.5 font-mono text-xl font-bold text-slate-100">
                {evalData.quizPct}%
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {totalCorrect}/{totalAnswered} benar · Skor terbaik {quizBestScore}/100 ({quizzesCompleted}x selesai · +10 XP/benar)
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
            <h2 className="mb-3 font-display text-base font-bold text-white">
              🧬 Koleksi Organ ({discovered.length}/{ORGANS.length})
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {ORGANS.map((o) => {
                const seen = discovered.includes(o.id);
                return (
                  <div
                    key={o.id}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${
                      seen
                        ? "border-slate-800/80 bg-slate-900/50 text-slate-200"
                        : "border-slate-900 bg-slate-950/40 text-slate-500 opacity-60"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: seen ? SYSTEMS[o.system].color : "transparent",
                        border: `1.5px solid ${SYSTEMS[o.system].color}`,
                      }}
                    />
                    <span className="truncate">{o.name.id}</span>
                    <span className="sr-only">
                      {seen ? "sudah ditemukan" : "belum ditemukan"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
            <h2 className="mb-3 font-display text-base font-bold text-white">
              🏅 Lencana Prestasi ({badges.length}/{BADGES.length})
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BADGES.map((b) => {
                const earned = badges.includes(b.id);
                const tierRing =
                  b.tier === "gold"
                    ? "from-amber-400 to-amber-600 text-slate-950"
                    : b.tier === "silver"
                      ? "from-slate-200 to-slate-400 text-slate-950"
                      : "from-amber-600 to-amber-800 text-slate-200";
                return (
                  <motion.div
                    key={b.id}
                    whileHover={{ y: -2 }}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                      earned
                        ? "border-slate-800 bg-slate-900/60 text-slate-200"
                        : "border-slate-900 bg-slate-950/40 text-slate-500 opacity-50"
                    }`}
                  >
                    <div
                      aria-hidden="true"
                      className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${tierRing} text-xl shadow-sm ${
                        earned ? "" : "grayscale opacity-40"
                      }`}
                    >
                      {b.icon}
                    </div>
                    <div className="text-xs font-bold leading-tight text-slate-200">{b.name}</div>
                    <div className="text-[10px] leading-tight text-slate-400">{b.desc}</div>
                    <span className="sr-only">{earned ? "sudah diraih" : "belum diraih"}</span>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Box({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-2.5 text-center">
      <div className="text-base" aria-hidden="true">{icon}</div>
      <div className="font-mono text-base font-bold text-slate-100">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}
