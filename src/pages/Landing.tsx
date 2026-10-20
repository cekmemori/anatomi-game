import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AnatomyScene from "../scenes/AnatomyScene";
import { SYSTEMS, SystemId } from "../data/organs";

export default function Landing() {
  const [activeSystemTab, setActiveSystemTab] = useState<SystemId | "all">("all");

  const systemList = Object.values(SYSTEMS);

  return (
    <div className="relative h-full w-full overflow-y-auto selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Subtle Top Ambient Light (Soft, not aggressive neon) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 h-[450px] w-[800px] rounded-full bg-cyan-900/15 blur-[120px]"
      />

      {/* Hero Section */}
      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
        {/* Left Column: Typography & Humanized Actions */}
        <div className="relative z-10 flex flex-col items-start">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-slate-700/60 bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 shadow-sm backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Kurikulum Biologi SMA & SMK Farmasi</span>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400 font-semibold">{systemList.length} Sistem Organ</span>
          </motion.div>

          {/* Main Headline: Editorial & Confident */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-6 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.12]"
          >
            Eksplorasi anatomi manusia dengan{" "}
            <span className="relative inline-block text-cyan-300">
              ketelitian klinis
              <svg
                className="absolute -bottom-1 left-0 w-full text-cyan-500/40"
                height="6"
                viewBox="0 0 100 6"
                preserveAspectRatio="none"
              >
                <path d="M0,5 Q50,0 100,5" stroke="currentColor" strokeWidth="2.5" fill="none" />
              </svg>
            </span>{" "}
            dan interaktivitas 3D.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-slate-300/90 sm:text-lg"
          >
            Tinggalkan hafalan buku teks yang abstrak. Putar sudut pandang tubuh secara 360°,
            kelupas lapisan otot hingga rangka, dan uji pemahaman klinis melalui kuis interaktif
            real-time.
          </motion.p>

          {/* Call to Actions (Clear Hierarchy, Tactile Feedback) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mt-8 flex flex-wrap items-center gap-3.5"
          >
            <Link
              to="/explore"
              className="group relative inline-flex items-center gap-2.5 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition-all duration-200 hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-400/20 active:scale-[0.98]"
            >
              <span className="text-base">🧭</span>
              <span>Mulai Jelajah 3D</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>

            <Link
              to="/quiz"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-5 py-3.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-slate-500 hover:bg-slate-800/80 hover:text-white active:scale-[0.98]"
            >
              <span>❓</span>
              <span>Latihan Kuis</span>
            </Link>

            <Link
              to="/teacher"
              className="inline-flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-cyan-300"
            >
              <span>👩‍🏫 Akses Pengajar</span>
              <span className="text-xs">↗</span>
            </Link>
          </motion.div>

          {/* Interactive Biological System Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="mt-10 border-t border-slate-800/80 pt-6 w-full"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium tracking-wide uppercase">Sistem Organ yang Tersedia:</span>
              <span className="text-[11px] text-slate-500">Klik untuk melihat fokus</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {systemList.map((s) => {
                const isActive = activeSystemTab === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSystemTab(isActive ? "all" : s.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? "border border-cyan-400/50 bg-cyan-950/60 text-cyan-200 shadow-sm"
                        : "border border-slate-800/90 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name.replace("Sistem ", "")}</span>
                  </button>
                );
              })}
            </div>

            {/* Active System Context Drawer preview */}
            {activeSystemTab !== "all" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-slate-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-300">
                    {SYSTEMS[activeSystemTab]?.icon} {SYSTEMS[activeSystemTab]?.name}
                  </span>
                  <Link
                    to={`/explore?system=${activeSystemTab}`}
                    className="font-medium text-cyan-400 hover:underline"
                  >
                    Buka di 3D →
                  </Link>
                </div>
                <p className="mt-1 text-slate-400 leading-relaxed">
                  {SYSTEMS[activeSystemTab]?.blurb}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Right Column: 3D Workstation Viewport Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/90 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl"
        >
          {/* Workstation Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[11px] text-slate-400">
                viewport://human-anatomy-3d
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>WebGL 60fps</span>
            </div>
          </div>

          {/* Interactive Canvas Container */}
          <div className="relative h-[420px] w-full sm:h-[480px] lg:h-[540px]">
            <AnatomyScene
              layers={{ skin: true, muscular: false, skeleton: true, organs: true }}
              showLabels={false}
              showMarkers={false}
              autoRotate
            />

            {/* Bottom Viewport Control Badges */}
            <div className="pointer-events-none absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-[11px]">
              <span className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-2.5 py-1 text-slate-300 backdrop-blur-md">
                🖱️ Tahan & Geser untuk Rotasi 360°
              </span>
              <span className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-2.5 py-1 text-slate-300 backdrop-blur-md">
                🔍 Scroll untuk Zoom
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid: Human-Centered Design Features */}
      <section className="relative mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Arsitektur Pembelajaran
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Dirancang untuk efektivitas pemahaman nyata
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-400">
            Kombinasi model 3D spasial, evaluasi formatif mandiri, dan integrasi kelas langsung
            tanpa friksi instalasi aplikasi tambahan.
          </p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-12">
          {/* Card 1: 3D Spatial Exploration (Wide - 7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/70 to-slate-950/90 p-7 transition-all duration-300 hover:border-slate-700 md:col-span-3 lg:col-span-7"
          >
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-800/40 text-2xl text-cyan-400 shadow-inner">
                🧊
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-white">
                Bedah Multi-Lapisan Organ Tubuh
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
                Akses kontrol transisi anatomi: mulai dari lapisan kulit superficial, topologi
                muskular, rangka penyangga, hingga organ viseral dalam. Dilengkapi anotasi klinis dan
                korelasi sistematis antarorgan.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-slate-700/60 bg-slate-800/50 px-2.5 py-1 text-slate-300">
                ✓ Lapisan Kulit & Rangka
              </span>
              <span className="rounded-md border border-slate-700/60 bg-slate-800/50 px-2.5 py-1 text-slate-300">
                ✓ Pembedahan Organ Selektif
              </span>
              <span className="rounded-md border border-slate-700/60 bg-slate-800/50 px-2.5 py-1 text-slate-300">
                ✓ Data Medis Terverifikasi
              </span>
            </div>
          </motion.div>

          {/* Card 2: Live Room & Teacher Dashboard (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/70 to-slate-950/90 p-7 transition-all duration-300 hover:border-slate-700 md:col-span-3 lg:col-span-5"
          >
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-950 border border-indigo-800/40 text-2xl text-indigo-400 shadow-inner">
                📡
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-white">
                Live Board & Sesi Kelas Tatap Muka
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
                Guru dapat menginisiasi sesi kuis kelas dengan 1 kali klik. Siswa bergabung instan via
                kode 5 karakter atau QR Code tanpa perlu registrasi akun yang rumit.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs text-slate-400">
              <div className="flex items-center justify-between text-slate-300 font-mono">
                <span>KODE ROOM: 7K2QD</span>
                <span className="text-emerald-400">● LIVE</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Papan peringkat terbarui secara otomatis per pertanyaan.
              </div>
            </div>
          </motion.div>

          {/* Card 3: Formative Quiz (6 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/70 to-slate-950/90 p-7 transition-all duration-300 hover:border-slate-700 md:col-span-3 lg:col-span-6"
          >
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-950 border border-amber-800/40 text-2xl text-amber-400 shadow-inner">
                🎯
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-white">
                Kuis Adaptif & Evaluasi Formatif
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
                Pertanyaan mencakup identifikasi letak spasial organ, patofisiologi dasar, dan
                mekanisme kerja sistem. Umpan balik penjelasan dihadirkan secara langsung setelah
                menjawab.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Link
                to="/quiz"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 transition-colors hover:text-amber-300"
              >
                Uji Pemahaman Sekarang <span>→</span>
              </Link>
            </div>
          </motion.div>

          {/* Card 4: Gamification & Badges (6 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/70 to-slate-950/90 p-7 transition-all duration-300 hover:border-slate-700 md:col-span-3 lg:col-span-6"
          >
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-800/40 text-2xl text-emerald-400 shadow-inner">
                🏆
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-white">
                Pencapaian & Progres Belajar Siswa
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
                Pencapaian berbasis lencana (*badges*), akumulasi poin XP, dan rekapitulasi data yang
                bisa diekspor guru langsung ke berkas CSV untuk rapor nilai kelas.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 rounded bg-slate-800/60 px-2 py-0.5">
                🏅 Ahli Anatomi
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-800/60 px-2 py-0.5">
                ⚡ Kuis Streak
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-800/60 px-2 py-0.5">
                📊 Rekap Nilai CSV
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Minimalis & Kredensial */}
      <footer className="border-t border-slate-800/80 bg-slate-950/50 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
          <div>
            <span className="font-semibold text-slate-400">AnatomiVerse 3D</span> · Media Edukasi
            Biologi SMA & Farmasi
          </div>
          <div>
            Model 3D bersumber dari <span className="text-slate-400">Z-Anatomy</span> (CC BY-SA 4.0)
          </div>
        </div>
      </footer>
    </div>
  );
}
