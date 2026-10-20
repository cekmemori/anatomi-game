import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { computeEvaluation, useGame, xpProgress } from "../store/useGame";
import { useAuth, verifyTeacherPin } from "../store/useAuth";

export default function StudentLoginModal() {
  const {
    loginModalOpen,
    closeLoginModal,
    studentName,
    studentClass,
    loginStudent,
    logoutStudent,
    xp,
    discovered,
    missionBestScore,
    totalCorrect,
    totalAnswered,
    loginModalInitialTab,
  } = useGame();

  const [tab, setTab] = useState<"student" | "teacher">("student");
  const [name, setName] = useState(studentName ?? "");
  const [kelas, setKelas] = useState(studentClass ?? "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Teacher login state
  const [teacherPin, setTeacherPin] = useState("");
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [teacherBusy, setTeacherBusy] = useState(false);

  const role = useAuth((s) => s.role);
  const setTeacher = useAuth((s) => s.setTeacher);
  const lockTeacher = useAuth((s) => s.lock);
  const navigate = useNavigate();

  useEffect(() => {
    if (loginModalOpen) {
      setName(studentName ?? "");
      setKelas(studentClass ?? "");
      setPin("");
      setError(null);
      setTeacherPin("");
      setTeacherError(null);
      setTeacherBusy(false);
      if (loginModalInitialTab) {
        setTab(loginModalInitialTab);
      } else if (role === "teacher" && !studentName) {
        setTab("teacher");
      } else {
        setTab("student");
      }
    }
  }, [loginModalOpen, loginModalInitialTab, studentName, studentClass, role]);

  useEffect(() => {
    if (!loginModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLoginModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loginModalOpen, closeLoginModal]);

  const evalData = computeEvaluation({
    discoveredCount: discovered.length,
    missionBestScore,
    totalCorrect,
    totalAnswered,
  });
  const { level } = xpProgress(xp);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await loginStudent(name, pin, kelas);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Gagal masuk.");
    }
  };

  const onTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherPin.trim() || teacherBusy) return;
    setTeacherError(null);
    setTeacherBusy(true);
    const ok = await verifyTeacherPin(teacherPin.trim());
    setTeacherBusy(false);
    if (ok) {
      if (studentName) logoutStudent();
      setTeacher(teacherPin.trim());
      closeLoginModal();
      navigate("/teacher");
    } else {
      setTeacherError("PIN Guru salah atau server tidak merespons.");
    }
  };

  return (
    <AnimatePresence>
      {loginModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-modal-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={closeLoginModal}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-md rounded-3xl p-6 sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="student-modal-title"
                  className="font-display text-2xl font-extrabold"
                >
                  {tab === "teacher"
                    ? role === "teacher"
                      ? "Area Guru (Aktif)"
                      : "Masuk Mode Guru"
                    : studentName
                      ? "Profil Evaluasi Siswa"
                      : "Login Evaluasi Siswa"}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {tab === "teacher"
                    ? role === "teacher"
                      ? "Mode Guru aktif. Anda memiliki akses penuh ke Rekap Nilai dan Host Kuis."
                      : "Masukkan PIN Guru untuk mengakses Dashboard Guru, Rekap Evaluasi, dan Host Kuis Live."
                    : studentName
                      ? "Seluruh progres Jelajah, Misi, Kuis, dan Pencapaianmu otomatis tercatat di halaman Rekap Guru."
                      : "Masukkan Nama dan PIN (4–8 karakter) agar nilai pencapaianmu tersimpan dan dievaluasi Guru."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeLoginModal}
                aria-label="Tutup dialog masuk"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            {/* Role Tab Switcher */}
            <div className="mt-4 flex rounded-xl bg-white/[0.06] p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setTab("student");
                  setError(null);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition-colors ${
                  tab === "student"
                    ? "bg-cyan-500/25 text-cyan-200 shadow-sm ring-1 ring-cyan-400/40"
                    : "text-muted hover:text-ink"
                }`}
              >
                <span aria-hidden="true">🎓</span>
                <span>Mode Siswa</span>
                {studentName && (
                  <span className="max-w-[70px] truncate text-[10px] text-cyan-300">
                    ({studentName})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("teacher");
                  setTeacherError(null);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition-colors ${
                  tab === "teacher"
                    ? "bg-gradient-to-r from-cyan-400/25 to-fuchsia-500/25 text-ink shadow-sm ring-1 ring-cyan-400/40"
                    : "text-muted hover:text-ink"
                }`}
              >
                <span aria-hidden="true">👩‍🏫</span>
                <span>Mode Guru</span>
                {role === "teacher" && (
                  <span className="rounded-full bg-emerald-400/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
                    Aktif
                  </span>
                )}
              </button>
            </div>

            {/* Tab: Siswa */}
            {tab === "student" &&
              (studentName ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-display text-lg font-extrabold text-night">
                        {studentName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-display text-lg font-bold">
                          {studentName}
                        </div>
                        <div className="text-xs text-cyan-200">
                          {studentClass ? `Kelas ${studentClass} · ` : ""}Level{" "}
                          {level} · {xp} XP
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-muted">
                          Nilai Evaluasi
                        </div>
                        <div className="font-mono text-2xl font-extrabold text-emerald-300">
                          {evalData.finalScore}{" "}
                          <span className="text-sm text-cyan-300">
                            ({evalData.grade})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="glass rounded-2xl p-2.5">
                      <div className="text-muted">Eksplorasi (30%)</div>
                      <div className="mt-0.5 font-mono text-base font-bold">
                        {evalData.explorePct}%
                      </div>
                    </div>
                    <div className="glass rounded-2xl p-2.5">
                      <div className="text-muted">Misi 3D (30%)</div>
                      <div className="mt-0.5 font-mono text-base font-bold">
                        {evalData.missionPct}%
                      </div>
                    </div>
                    <div className="glass rounded-2xl p-2.5">
                      <div className="text-muted">Kuis (40%)</div>
                      <div className="mt-0.5 font-mono text-base font-bold">
                        {evalData.quizPct}%
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => logoutStudent()}
                      className="glass flex-1 rounded-2xl px-4 py-3 text-xs font-bold text-red-300 hover:bg-red-500/15"
                    >
                      🚪 Keluar / Ganti Siswa
                    </button>
                    <button
                      type="button"
                      onClick={closeLoginModal}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-xs font-bold text-night"
                    >
                      Lanjut Belajar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
                  <div>
                    <label
                      htmlFor="modal-student-name"
                      className="block text-xs font-bold uppercase tracking-widest text-muted"
                    >
                      Nama Siswa
                    </label>
                    <input
                      id="modal-student-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={32}
                      required
                      placeholder="mis. Alya Pratama"
                      className="mt-1 w-full rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm outline-none focus:border-cyan-400/70"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="modal-student-class"
                        className="block text-xs font-bold uppercase tracking-widest text-muted"
                      >
                        Kelas (Opsional)
                      </label>
                      <input
                        id="modal-student-class"
                        value={kelas}
                        onChange={(e) => setKelas(e.target.value)}
                        maxLength={24}
                        placeholder="mis. XI MIPA 1"
                        className="mt-1 w-full rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm outline-none focus:border-cyan-400/70"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="modal-student-pin"
                        className="block text-xs font-bold uppercase tracking-widest text-muted"
                      >
                        PIN Siswa (4–8 digit)
                      </label>
                      <input
                        id="modal-student-pin"
                        type="password"
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) =>
                          setPin(e.target.value.replace(/[^A-Za-z0-9]/g, ""))
                        }
                        minLength={4}
                        maxLength={12}
                        required
                        placeholder="mis. 1234"
                        className="mt-1 w-full rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-2.5 font-mono text-sm tracking-widest outline-none focus:border-cyan-400/70"
                      />
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-2xl border border-red-400/40 bg-red-400/10 px-4 py-2.5 text-xs text-red-300"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      busy || name.trim().length < 2 || pin.trim().length < 4
                    }
                    className="mt-2 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3 text-sm font-bold text-night shadow-[0_10px_40px_-10px_rgba(34,211,238,0.9)] transition-transform hover:scale-[1.01] disabled:opacity-40"
                  >
                    {busy ? "Menyimpan…" : "🔐 Masuk & Simpan Evaluasi"}
                  </button>
                </form>
              ))}

            {/* Tab: Guru */}
            {tab === "teacher" &&
              (role === "teacher" ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-xl font-extrabold text-night">
                        👩‍🏫
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-bold text-ink">
                          Mode Guru Sedang Aktif
                        </div>
                        <div className="text-xs text-cyan-200">
                          Menu Guru dan Host Kuis dapat diakses di bilah atas.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        lockTeacher();
                        closeLoginModal();
                        navigate("/");
                      }}
                      className="glass flex-1 rounded-2xl px-4 py-3 text-xs font-bold text-red-300 hover:bg-red-500/15"
                    >
                      🔓 Keluar Mode Guru
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeLoginModal();
                        navigate("/teacher");
                      }}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-xs font-bold text-night transition-transform hover:scale-[1.01]"
                    >
                      Buka Rekap Guru →
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={onTeacherSubmit} className="mt-5 space-y-3.5">
                  <div>
                    <label
                      htmlFor="modal-teacher-pin"
                      className="block text-xs font-bold uppercase tracking-widest text-muted"
                    >
                      PIN Akses Guru
                    </label>
                    <input
                      id="modal-teacher-pin"
                      type="password"
                      inputMode="numeric"
                      autoComplete="current-password"
                      value={teacherPin}
                      onChange={(e) => {
                        setTeacherPin(e.target.value);
                        setTeacherError(null);
                      }}
                      placeholder="mis. 2025"
                      required
                      className="mt-1.5 w-full rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3 text-center font-mono text-lg tracking-[0.3em] outline-none transition-colors focus:border-cyan-400/70"
                    />
                    <p className="mt-1.5 text-center text-[11px] text-muted">
                      PIN default guru:{" "}
                      <span className="font-mono font-bold text-cyan-300">
                        2025
                      </span>
                    </p>
                  </div>

                  {teacherError && (
                    <div
                      role="alert"
                      className="rounded-2xl border border-red-400/40 bg-red-400/10 px-4 py-2 text-center text-xs text-red-300"
                    >
                      {teacherError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={teacherBusy || !teacherPin.trim()}
                    className="mt-2 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-night shadow-[0_10px_40px_-10px_rgba(34,211,238,0.9)] transition-transform hover:scale-[1.01] disabled:opacity-40"
                  >
                    {teacherBusy ? "Memeriksa…" : "🔓 Masuk sebagai Guru"}
                  </button>
                </form>
              ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
