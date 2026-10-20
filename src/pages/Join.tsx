import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSession } from "../store/useSession";
import { useGame } from "../store/useGame";

export default function Join() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { join, joined, error, clearMessages, connected, name: storedName } = useSession();
  const studentName = useGame((s) => s.studentName);

  const [name, setName] = useState(storedName ?? "");
  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());

  useEffect(() => clearMessages(), [clearMessages]);

  useEffect(() => {
    if (joined) navigate("/play", { replace: true });
  }, [joined, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || code.length < 5) return;
    join(code, name.trim());
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col justify-center overflow-y-auto px-4 pb-8">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/90 p-7 sm:p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
          <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Portal Siswa</span>
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Gabung Sesi Kuis
        </h1>
        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed" id="join-hint">
          Masukkan nama Anda dan 5 karakter kode sesi yang dibagikan oleh guru di layar proyektor.
        </p>

        <div className="mt-6 flex items-center justify-between">
          <label
            htmlFor="join-name"
            className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300"
          >
            Nama Siswa
          </label>
          {studentName && name !== studentName && (
            <button
              type="button"
              onClick={() => setName(studentName)}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              Pakai profil ({studentName})
            </button>
          )}
        </div>
        <input
          id="join-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          required
          aria-required="true"
          aria-describedby="join-hint"
          autoComplete="name"
          placeholder="mis. Alya Pratama"
          className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-cyan-400/80 focus:bg-slate-900"
        />

        <label
          htmlFor="join-code"
          className="mt-4 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300"
        >
          Kode Sesi (5 Karakter)
        </label>
        <input
          id="join-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          maxLength={5}
          required
          aria-required="true"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="7K2QD"
          className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-center font-mono text-2xl font-extrabold tracking-[0.35em] text-cyan-300 placeholder-slate-600 outline-none transition-colors focus:border-cyan-400/80 focus:bg-slate-900"
        />

        {error && (
          <div
            role="alert"
            className="mt-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3.5 py-2.5 text-xs text-rose-300"
          >
            {error}
          </div>
        )}
        {!connected && (
          <div
            role="status"
            className="mt-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3.5 py-2.5 text-xs text-amber-300"
          >
            Menyambung ke server sesi… Pastikan koneksi internet atau server guru aktif.
          </div>
        )}

        <button
          type="submit"
          disabled={!name.trim() || code.length < 5}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-md shadow-cyan-400/20 transition-all hover:bg-cyan-300 active:scale-[0.98] disabled:opacity-40"
        >
          <span>Masuk ke Ruang Kuis</span>
          <span>→</span>
        </button>

        <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400">
          <Link to="/" className="transition-colors hover:text-slate-200">
            ← Kembali ke Beranda
          </Link>
          <Link to="/host" className="text-cyan-400 transition-colors hover:text-cyan-300">
            Mode Guru (Host) →
          </Link>
        </div>
      </motion.form>
    </div>
  );
}
