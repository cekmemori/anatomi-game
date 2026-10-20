import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useGame, xpProgress } from "../store/useGame";
import { useAuth } from "../store/useAuth";

const NAV = [
  { to: "/explore", label: "Jelajah", icon: "🧭", public: true },
  { to: "/missions", label: "Misi", icon: "🎯", studentOnly: true },
  { to: "/quiz", label: "Kuis", icon: "❓", studentOnly: true },
  { to: "/join", label: "Gabung", icon: "🎟️", studentOnly: true },
  { to: "/achievements", label: "Pencapaian", icon: "🏆", studentOnly: true },
  { to: "/teacher", label: "Guru", icon: "👩‍🏫", teacher: true },
  { to: "/host", label: "Host", icon: "📡", teacher: true },
];

export default function TopBar() {
  const {
    xp,
    coins,
    streak,
    badges,
    discovered,
    studentName,
    studentClass,
    openLoginModal,
    logoutStudent,
  } = useGame();
  const { level, pct } = xpProgress(xp);
  const role = useAuth((s) => s.role);
  const lock = useAuth((s) => s.lock);
  const navigate = useNavigate();
  const isStudent = Boolean(studentName);
  const isTeacher = role === "teacher" && !isStudent;
  const nav = NAV.filter((n) => {
    if (n.public) return true;
    if (n.studentOnly) return isStudent;
    if (n.teacher) return isTeacher;
    return false;
  });

  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const authMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authMenuOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        authMenuRef.current &&
        !authMenuRef.current.contains(e.target as Node)
      ) {
        setAuthMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [authMenuOpen]);

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-2.5 px-3 py-2.5 sm:px-5 sm:py-3 lg:flex-nowrap">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      {/* Brand Logo */}
      <NavLink to="/" className="group flex h-11 shrink-0 items-center gap-2.5">
        <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 shadow-sm transition-transform group-hover:scale-105">
          <span className="text-lg" aria-hidden="true">🫀</span>
        </div>
        <div className="hidden leading-tight sm:block" aria-hidden="true">
          <div className="font-display text-[15px] font-extrabold tracking-tight text-white">
            Anatomi<span className="text-cyan-400">Verse</span>
          </div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-slate-400">Laboratorium 3D</div>
        </div>
        <span className="sr-only">AnatomiVerse 3D, beranda</span>
      </NavLink>

      {/* Navigation Pill */}
      <nav
        aria-label="Navigasi utama"
        className="no-scrollbar order-3 flex h-11 shrink-0 items-center gap-0.5 overflow-x-auto overflow-y-hidden rounded-xl border border-slate-800 bg-slate-950/80 p-1.5 shadow-sm sm:gap-1 lg:order-2"
      >
        {nav.map((n, idx) => {
          const isFirstTeacher = Boolean(n.teacher && !nav[idx - 1]?.teacher);
          return (
            <div key={n.to} className="flex shrink-0 items-center gap-1">
              {isFirstTeacher && (
                <span
                  aria-hidden="true"
                  className="mx-0.5 h-5 w-px bg-slate-800"
                />
              )}
              <NavLink to={n.to} aria-label={n.label} title={n.label}>
                {({ isActive }) => (
                  <span
                    className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold whitespace-nowrap transition-colors sm:px-3 sm:text-[13px] ${
                      isActive
                        ? n.teacher
                          ? "bg-cyan-950/60 text-cyan-200 border border-cyan-500/40 shadow-sm"
                          : "bg-slate-800 text-white shadow-sm"
                        : n.teacher
                          ? "text-cyan-300/80 hover:bg-slate-900 hover:text-white"
                          : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <span className="text-sm leading-none" aria-hidden="true">
                      {n.icon}
                    </span>
                    <span className="hidden md:inline">{n.label}</span>
                  </span>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Right Status & Badges Pill */}
      <div className="order-2 ml-auto flex h-11 shrink-0 items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/80 p-1.5 shadow-sm sm:gap-1.5 lg:order-3 lg:ml-0">
        {/* Compact Single Auth Button with Dropdown (Siswa & dibawahnya Guru) */}
        <div ref={authMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setAuthMenuOpen((v) => !v)}
            aria-expanded={authMenuOpen}
            aria-haspopup="menu"
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
              role === "teacher"
                ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40"
                : studentName
                  ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40"
                  : "border-slate-800 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <span aria-hidden="true">
              {role === "teacher" ? "👩‍🏫" : studentName ? "🎓" : "👤"}
            </span>
            <span className="max-w-[100px] truncate">
              {role === "teacher"
                ? "Guru"
                : studentName
                  ? studentName
                  : "Masuk"}
            </span>
            <span
              aria-hidden="true"
              className="text-[9px] text-slate-400 transition-transform duration-200"
              style={{
                transform: authMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              ▼
            </span>
          </button>

          {/* Floating Dropdown: Siswa & dibawahnya Guru */}
          <AnimatePresence>
            {authMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                role="menu"
                aria-label="Pilihan Peran Masuk"
                className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-slate-800 z-50"
              >
                {/* Opsi 1: Siswa */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAuthMenuOpen(false);
                    openLoginModal("student");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-900"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-lg text-cyan-300">
                    🎓
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {studentName ? studentName : "Siswa"}
                      </span>
                      {studentName && (
                        <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-cyan-300">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {studentName
                        ? `${studentClass ? `Kelas ${studentClass} · ` : ""}Profil & Nilai Evaluasi`
                        : "Evaluasi belajar & kuis"}
                    </div>
                  </div>
                </button>

                {/* Garis Pemisah Halus */}
                <div className="my-1 h-px bg-slate-800" />

                {/* Opsi 2: Guru (dibawahnya Siswa) */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAuthMenuOpen(false);
                    if (role === "teacher") {
                      navigate("/teacher");
                    } else {
                      openLoginModal("teacher");
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-900"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-purple-500/30 bg-purple-950/40 text-lg text-purple-300">
                    👩‍🏫
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Guru</span>
                      {role === "teacher" && (
                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-300">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {role === "teacher"
                        ? "Buka Dashboard & Rekap Nilai"
                        : "Dashboard, rekap nilai & live kuis"}
                    </div>
                  </div>
                </button>

                {/* Aksi Keluar Guru jika aktif */}
                {role === "teacher" && (
                  <>
                    <div className="my-1 h-px bg-slate-800" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAuthMenuOpen(false);
                        lock();
                        navigate("/");
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-950/20"
                    >
                      <span aria-hidden="true">🔓</span>
                      <span>Keluar Mode Guru</span>
                    </button>
                  </>
                )}

                {/* Aksi Keluar Siswa jika aktif dan bukan Guru */}
                {studentName && role !== "teacher" && (
                  <>
                    <div className="my-1 h-px bg-slate-800" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAuthMenuOpen(false);
                        logoutStudent();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-950/20"
                    >
                      <span aria-hidden="true">🚪</span>
                      <span>Keluar / Ganti Siswa</span>
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {studentName && (
          <>
            <span aria-hidden="true" className="hidden h-5 w-px bg-slate-800 sm:block" />

            <div className="hidden h-8 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 xl:flex">
              <span className="grid h-5 w-5 place-items-center rounded-md border border-cyan-500/30 bg-cyan-950/40 font-mono text-[10px] font-bold text-cyan-300">
                {level}
              </span>
              <div className="w-20">
                <div className="mb-0.5 flex justify-between text-[10px] leading-none text-slate-400">
                  <span className="font-mono">Lv.{level}</span>
                  <span className="font-mono">{xp} XP</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    className="h-full rounded-full bg-cyan-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            </div>

            <div className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2 text-xs font-bold text-amber-300 sm:gap-2 sm:px-2.5 sm:text-[13px]">
              <span aria-hidden="true">🔥</span>
              <span className="font-mono">{streak}</span>
              <span className="sr-only">Hari berturut-turut</span>
            </div>

            <div className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2 text-xs font-bold text-yellow-300 sm:gap-2 sm:px-2.5 sm:text-[13px]">
              <span aria-hidden="true">🪙</span>
              <span className="font-mono">{coins}</span>
              <span className="sr-only">Koin</span>
            </div>

            <div className="hidden h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2 text-xs font-bold text-purple-300 sm:flex sm:gap-2 sm:px-2.5 sm:text-[13px]">
              <span aria-hidden="true">🧠</span>
              <span className="font-mono">{discovered.length}</span>
              <span className="sr-only">Organ ditemukan</span>
            </div>

            {badges.length > 0 && (
              <div className="hidden h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2 text-xs font-bold text-cyan-300 lg:flex lg:gap-2 lg:px-2.5 lg:text-[13px]">
                <span aria-hidden="true">🎖️</span>
                <span className="font-mono">{badges.length}</span>
                <span className="sr-only">Lencana</span>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
