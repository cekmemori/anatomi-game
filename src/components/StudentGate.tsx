import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useGame } from "../store/useGame";

export default function StudentGate({
  children,
  featureName = "fitur ini",
}: {
  children: React.ReactNode;
  featureName?: string;
}) {
  const studentName = useGame((s) => s.studentName);
  const loginStudent = useGame((s) => s.loginStudent);
  const openLoginModal = useGame((s) => s.openLoginModal);

  const [name, setName] = useState("");
  const [kelas, setKelas] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (studentName) return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pin.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await loginStudent(name.trim(), pin.trim(), kelas.trim());
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Gagal masuk. Periksa Nama dan PIN Anda.");
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 pb-10">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="glass-strong m-auto w-full max-w-md rounded-3xl p-6 sm:p-8"
      >
        <div
          className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 text-3xl shadow-sm border border-cyan-400/30"
          aria-hidden="true"
        >
          🔒
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold">
          Akses Khusus Siswa
        </h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Silakan masuk dengan Nama &amp; PIN Siswa untuk mengakses {featureName} agar
          nilai kuis, pencapaian, dan evaluasi tercatat ke akun Anda.
        </p>

        <div className="mt-5 space-y-3 text-left">
          <div>
            <label
              htmlFor="gate-student-name"
              className="block text-xs font-bold uppercase tracking-widest text-muted"
            >
              Nama Siswa
            </label>
            <input
              id="gate-student-name"
              type="text"
              required
              maxLength={32}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="mis. Budi Pratama"
              className="mt-1 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm outline-none transition-colors focus:border-cyan-400/60"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="gate-student-class"
                className="block text-xs font-bold uppercase tracking-widest text-muted"
              >
                Kelas (Opsional)
              </label>
              <input
                id="gate-student-class"
                type="text"
                maxLength={24}
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                placeholder="mis. XI MIPA 1"
                className="mt-1 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm outline-none transition-colors focus:border-cyan-400/60"
              />
            </div>
            <div>
              <label
                htmlFor="gate-student-pin"
                className="block text-xs font-bold uppercase tracking-widest text-muted"
              >
                PIN Siswa (4–8 digit)
              </label>
              <input
                id="gate-student-pin"
                type="password"
                inputMode="numeric"
                required
                minLength={4}
                maxLength={12}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/[^A-Za-z0-9]/g, ""));
                  setError(null);
                }}
                placeholder="mis. 1234"
                className="mt-1 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-2.5 font-mono text-sm tracking-widest outline-none transition-colors focus:border-cyan-400/60"
              />
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-3 text-center text-xs text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || name.trim().length < 2 || pin.trim().length < 4}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3.5 font-bold text-night shadow-[0_10px_40px_-10px_rgba(34,211,238,0.9)] transition-transform hover:scale-[1.02] disabled:opacity-40"
        >
          {busy ? "Memproses…" : "Masuk Sebagai Siswa"}
        </button>

        <div className="mt-4 flex flex-col items-center gap-2 text-xs text-muted">
          <button
            type="button"
            onClick={() => openLoginModal("student")}
            className="hover:text-cyan-300 underline underline-offset-4"
          >
            Buka dialog masuk alternatif
          </button>
          <Link to="/explore" className="hover:text-ink">
            ← Kembali ke Jelajah 3D
          </Link>
        </div>
      </motion.form>
    </div>
  );
}
