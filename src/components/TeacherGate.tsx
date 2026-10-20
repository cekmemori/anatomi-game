import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, verifyTeacherPin } from "../store/useAuth";

export default function TeacherGate({ children }: { children: React.ReactNode }) {
  const role = useAuth((s) => s.role);
  const setTeacher = useAuth((s) => s.setTeacher);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (role === "teacher") return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || busy) return;
    setBusy(true);
    setError(null);
    const ok = await verifyTeacherPin(pin);
    setBusy(false);
    if (ok) {
      setTeacher(pin);
      setPin("");
    } else {
      setError("PIN tidak valid atau koneksi server terputus.");
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col justify-center overflow-y-auto px-4 py-8">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
      >
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900 text-lg">
            🔒
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-white">
              Portal Akses Pengajar
            </h1>
            <p className="text-xs text-slate-400">
              Otentikasi khusus guru & instruktur biologi
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300 leading-relaxed">
          Masukkan kode PIN pengajar yang telah terdaftar untuk membuka dashboard analitik siswa,
          manajemen bank soal, dan kendali kuis langsung (Live Board).
        </p>

        <div className="mt-5">
          <label htmlFor="teacher-pin" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Kode PIN Guru
          </label>
          <input
            id="teacher-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(null);
            }}
            placeholder="••••"
            aria-invalid={Boolean(error)}
            className={`w-full rounded-xl border bg-slate-900/60 px-4 py-3 text-center font-mono text-xl tracking-[0.4em] text-white outline-none transition-colors duration-150 ${
              error
                ? "border-rose-500/80 bg-rose-950/20"
                : "border-slate-700/80 focus:border-cyan-400"
            }`}
          />
        </div>

        {error && (
          <div role="alert" className="mt-2.5 rounded-lg border border-rose-500/30 bg-rose-950/30 p-2 text-center text-xs text-rose-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !pin.trim()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-xs font-bold text-slate-950 transition-all hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-400/20 active:scale-[0.98] disabled:opacity-40"
        >
          {busy ? (
            <span>Memverifikasi Akses…</span>
          ) : (
            <>
              <span>Buka Dashboard Guru</span>
              <span>→</span>
            </>
          )}
        </button>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-xs text-slate-400 transition-colors hover:text-slate-200"
          >
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </motion.form>
    </div>
  );
}
