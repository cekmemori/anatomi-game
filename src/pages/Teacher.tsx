import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ORGANS, SYSTEMS, SystemId } from "../data/organs";
import { BADGES } from "../data/badges";
import { pct, useTeacher, SessionRecord } from "../store/useTeacher";
import { useAuth } from "../store/useAuth";
import {
  computeEvaluation,
  levelFromXp,
  StudentServerProfile,
} from "../store/useGame";
import { socket } from "../realtime/socket";
import { downloadCsv } from "../lib/csv";

const STAT_ACCENT = {
  cyan: "border-cyan-500/30 bg-cyan-950/20 text-cyan-400",
  violet: "border-purple-500/30 bg-purple-950/20 text-purple-300",
  amber: "border-amber-500/30 bg-amber-950/20 text-amber-300",
  emerald: "border-emerald-500/30 bg-emerald-950/20 text-emerald-300",
} as const;

const STAGE_LABEL: Record<string, string> = {
  lobby: "Lobby",
  study: "Belajar",
  quiz: "Sedang kuis",
  ended: "Selesai",
};

function systemName(id: SystemId | "all") {
  return id === "all" ? "Semua Sistem" : SYSTEMS[id]?.name ?? id;
}

export default function Teacher() {
  const { sessions, removeSession, clearAll } = useTeacher();
  const teacherPin = useAuth((s) => s.pin) || "2025";
  const [selected, setSelected] = useState(sessions[0]?.code ?? "");
  const [students, setStudents] = useState<StudentServerProfile[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState("");

  const fetchStudents = useCallback(() => {
    socket.emit(
      "teacher:students:list",
      { pin: teacherPin },
      (res: { ok: boolean; students?: StudentServerProfile[] }) => {
        if (res?.ok && Array.isArray(res.students)) {
          setStudents(res.students);
        }
      },
    );
  }, [teacherPin]);

  useEffect(() => {
    fetchStudents();
    const onUpdate = (data: { students?: StudentServerProfile[] }) => {
      if (Array.isArray(data?.students)) {
        setStudents(data.students);
      }
    };
    socket.on("teacher:students:update", onUpdate);
    socket.on("connect", fetchStudents);
    return () => {
      socket.off("teacher:students:update", onUpdate);
      socket.off("connect", fetchStudents);
    };
  }, [fetchStudents]);

  useEffect(() => {
    if (!sessions.find((s) => s.code === selected)) {
      setSelected(sessions[0]?.code ?? "");
    }
  }, [sessions, selected]);

  const active: SessionRecord | undefined = sessions.find((s) => s.code === selected);

  const roster = useMemo(() => {
    if (!active) return [];
    return [...active.participants].sort(
      (a, b) => b.score - a.score || a.name.localeCompare(b.name),
    );
  }, [active]);

  const aggregate = useMemo(() => {
    const map = new Map<
      string,
      { name: string; score: number; correct: number; answered: number; sessions: number }
    >();
    for (const s of sessions) {
      for (const p of s.participants) {
        const key = p.name.toLowerCase();
        const cur = map.get(key) ?? {
          name: p.name,
          score: 0,
          correct: 0,
          answered: 0,
          sessions: 0,
        };
        cur.score += p.score;
        cur.correct += p.correct;
        cur.answered += p.answered;
        cur.sessions += 1;
        map.set(key, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.correct - a.correct || b.score - a.score);
  }, [sessions]);

  const evaluatedStudents = useMemo(() => {
    return students
      .map((st) => {
        const ev = computeEvaluation({
          discoveredCount: st.discovered.length,
          missionBestScore: st.missionBestScore,
          totalCorrect: st.totalCorrect,
          totalAnswered: st.totalAnswered,
        });
        return {
          ...st,
          level: levelFromXp(st.xp),
          eval: ev,
        };
      })
      .sort(
        (a, b) =>
          b.eval.finalScore - a.eval.finalScore ||
          b.xp - a.xp ||
          a.name.localeCompare(b.name),
      );
  }, [students]);

  const exportEvaluationCsv = () => {
    if (!evaluatedStudents.length) return;
    downloadCsv("evaluasi-pencapaian-siswa.csv", [
      ["Rekap Evaluasi & Pencapaian Siswa AnatomiVerse 3D"],
      ["Waktu Unduh", new Date().toLocaleString("id-ID")],
      [
        "Rumus Evaluasi",
        "30% Eksplorasi Organ + 30% Skor Misi 3D + 40% Akurasi Kuis",
      ],
      [],
      [
        "No",
        "Nama Siswa",
        "Kelas",
        "PIN",
        "Level",
        "XP",
        "Koin",
        "Organ Ditemukan",
        "Eksplorasi(%)",
        "Misi Dimainkan",
        "Skor Misi Terbaik",
        "Misi(%)",
        "Soal Dijawab",
        "Jawaban Benar",
        "Akurasi Kuis(%)",
        "Badge Diraih",
        "Nilai Evaluasi (0-100)",
        "Predikat",
        "Terakhir Aktif",
      ],
      ...evaluatedStudents.map((s, idx) => [
        idx + 1,
        s.name,
        s.kelas || "-",
        s.pin || "-",
        s.level,
        s.xp,
        s.coins,
        `${s.discovered.length}/${ORGANS.length}`,
        s.eval.explorePct,
        s.missionsPlayed,
        s.missionBestScore,
        s.eval.missionPct,
        s.totalAnswered,
        s.totalCorrect,
        s.eval.quizPct,
        `${s.badges.length}/${BADGES.length}`,
        s.eval.finalScore,
        s.eval.grade,
        new Date(s.updatedAt).toLocaleString("id-ID"),
      ]),
    ]);
  };

  const handleSavePin = (key: string) => {
    const clean = newPinValue.trim().replace(/[^A-Za-z0-9]/g, "");
    if (clean.length < 4) return;
    socket.emit(
      "teacher:student:resetpin",
      { pin: teacherPin, key, newPin: clean },
      (res: { ok: boolean }) => {
        if (res?.ok) {
          setEditingKey(null);
          setNewPinValue("");
          fetchStudents();
        }
      },
    );
  };

  const handleDeleteStudent = (key: string, name: string) => {
    if (!window.confirm(`Hapus data evaluasi siswa "${name}"?`)) return;
    socket.emit("teacher:student:delete", { pin: teacherPin, key }, () => {
      fetchStudents();
    });
  };

  const exportCsv = () => {
    if (!active) return;
    downloadCsv(`rekap-sesi-${active.code}.csv`, [
      ["Sesi", active.code],
      ["Judul", active.title],
      ["Waktu", new Date(active.createdAt).toLocaleString("id-ID")],
      [],
      ["Nama", "Skor", "Dijawab", "Benar", "Akurasi(%)", "Status"],
      ...roster.map((p) => [
        p.name,
        p.score,
        p.answered,
        p.correct,
        pct(p.correct, p.answered),
        p.connected ? "terhubung" : "keluar",
      ]),
      [],
      ["Rekap per Soal"],
      ["No", "Soal", "Benar", "Dijawab", "Akurasi(%)"],
      ...(active.questionStats ?? []).map((q) => [
        q.index + 1,
        q.prompt,
        q.correct,
        q.answered,
        pct(q.correct, q.answered),
      ]),
    ]);
  };

  const clearAllConfirm = () => {
    if (
      sessions.length &&
      window.confirm("Hapus semua rekap sesi? Tindakan ini tidak bisa dibatalkan.")
    ) {
      clearAll();
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
              <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">Dashboard Instruktur</span>
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Rekapitulasi Evaluasi & Kuis
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Pantau progres belajar mandiri siswa, riwayat sesi kuis tatap muka, dan ekspor data nilai.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportEvaluationCsv}
              disabled={!evaluatedStudents.length}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 px-3.5 py-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-900/40 disabled:opacity-40"
            >
              <span>⬇</span>
              <span>CSV Evaluasi Siswa</span>
            </button>
            <button
              onClick={exportCsv}
              disabled={!active}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-40"
            >
              <span>⬇</span>
              <span>Export Sesi</span>
            </button>
            <button
              onClick={clearAllConfirm}
              disabled={!sessions.length}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-800 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200 disabled:opacity-30"
              title="Bersihkan riwayat sesi lokal"
            >
              <span>🗑</span>
            </button>
            <Link
              to="/host"
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:bg-cyan-300 hover:shadow-md hover:shadow-cyan-400/20 active:scale-[0.98]"
            >
              <span>📡</span>
              <span>Buka Sesi Live Board</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Bagian 1: Evaluasi & Pencapaian Siswa (Login Nama + PIN) */}
        <Panel
          title="📋 Evaluasi & Pencapaian Siswa (Login Nama + PIN)"
          subtitle="Nilai dihitung dari 30% Eksplorasi Organ (31 organ) + 30% Skor Misi 3D + 40% Akurasi Kuis"
          className="mb-6"
        >
          {evaluatedStudents.length === 0 ? (
            <p className="text-sm text-muted">
              Belum ada siswa yang login dengan Nama &amp; PIN. Arahkan siswa untuk
              menekan tombol <span className="font-semibold text-ink">Masuk Siswa</span>{" "}
              di pojok kanan atas atau di halaman{" "}
              <span className="font-semibold text-ink">Pencapaian</span>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-sm">
                <caption className="sr-only">
                  Tabel evaluasi pencapaian seluruh siswa
                </caption>
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
                    <th scope="col" className="pb-2 font-semibold">#</th>
                    <th scope="col" className="pb-2 font-semibold">Siswa &amp; Kelas</th>
                    <th scope="col" className="pb-2 font-semibold">PIN</th>
                    <th scope="col" className="pb-2 text-center font-semibold">Level / XP</th>
                    <th scope="col" className="pb-2 text-center font-semibold">Eksplorasi (30%)</th>
                    <th scope="col" className="pb-2 text-center font-semibold">Misi 3D (30%)</th>
                    <th scope="col" className="pb-2 text-center font-semibold">Kuis (40%)</th>
                    <th scope="col" className="pb-2 text-center font-semibold">Nilai Evaluasi</th>
                    <th scope="col" className="pb-2 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluatedStudents.map((st, idx) => (
                    <tr
                      key={st.key}
                      className="border-t border-white/5 transition hover:bg-white/[0.04]"
                    >
                      <td className="py-2.5 pr-2 font-mono text-xs text-muted">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold text-ink">{st.name}</div>
                        <div className="text-[11px] text-muted">
                          {st.kelas ? `Kelas ${st.kelas} · ` : ""}
                          {st.badges.length}/{BADGES.length} badge
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {editingKey === st.key ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={newPinValue}
                              onChange={(e) =>
                                setNewPinValue(
                                  e.target.value.replace(/[^A-Za-z0-9]/g, ""),
                                )
                              }
                              maxLength={12}
                              aria-label={`PIN baru untuk ${st.name}`}
                              placeholder="PIN baru"
                              className="w-20 rounded-lg border border-cyan-400/50 bg-black/40 px-2 py-1 text-xs outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePin(st.key)}
                              className="rounded-lg bg-emerald-400/20 px-2 py-1 text-[10px] font-bold text-emerald-300"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingKey(null)}
                              className="rounded-lg bg-white/10 px-1.5 py-1 text-[10px] text-muted"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="rounded-lg bg-white/[0.06] px-2 py-1 text-cyan-200">
                            {st.pin ?? "••••"}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-center font-mono text-xs">
                        <span className="font-bold text-cyan-300">Lv.{st.level}</span> ·{" "}
                        {st.xp} XP
                      </td>
                      <td className="py-2.5 text-center font-mono text-xs">
                        <div className="font-bold">{st.eval.explorePct}%</div>
                        <div className="text-[10px] text-muted">
                          {st.discovered.length}/{ORGANS.length} organ
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-mono text-xs">
                        <div className="font-bold">{st.eval.missionPct}%</div>
                        <div className="text-[10px] text-muted">
                          Skor {st.missionBestScore} ({st.missionsPlayed}x)
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-mono text-xs">
                        <div className="font-bold">{st.eval.quizPct}%</div>
                        <div className="text-[10px] text-muted">
                          {st.totalCorrect}/{st.totalAnswered} benar
                        </div>
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 font-mono text-xs font-extrabold ${
                            st.eval.finalScore >= 75
                              ? "bg-emerald-400/15 text-emerald-300"
                              : st.eval.finalScore >= 60
                                ? "bg-amber-400/15 text-amber-300"
                                : "bg-red-400/15 text-red-300"
                          }`}
                        >
                          {st.eval.finalScore} ({st.eval.grade})
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingKey(st.key);
                              setNewPinValue(st.pin ?? "");
                            }}
                            className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-semibold text-muted hover:text-ink"
                          >
                            PIN
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(st.key, st.name)}
                            aria-label={`Hapus evaluasi ${st.name}`}
                            className="rounded-lg bg-white/10 px-2 py-1 text-[11px] text-muted hover:text-red-300"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-2xl">
              📊
            </div>
            <h2 className="font-display text-lg font-bold text-white">Belum ada sesi</h2>
            <p className="max-w-md text-xs text-slate-400">
              Buka halaman <span className="text-slate-200 font-semibold">Host</span>, buat sesi, dan mulai kuis interaktif.
              Nilai dan analisis siswa akan tersinkronisasi di sini secara otomatis.
            </p>
            <Link
              to="/host"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-400/20 active:scale-[0.98]"
            >
              <span>Buka Host Sesi</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {sessions.map((s) => {
                const isActive = s.code === selected;
                return (
                  <div
                    key={s.code}
                    className={`group flex items-center gap-1 rounded-2xl border py-1.5 pl-3.5 pr-2 text-sm font-semibold transition-all ${
                      isActive
                        ? "border-cyan-400/50 bg-cyan-400/10"
                        : "border-white/10 bg-white/[0.03] text-muted hover:text-ink"
                    }`}
                  >
                    <button
                      onClick={() => setSelected(s.code)}
                      aria-pressed={isActive}
                      className="flex items-center gap-2 py-1"
                    >
                      <span className="font-mono tracking-wider">{s.code}</span>
                      <span className="hidden sm:inline">{s.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          s.stage === "ended"
                            ? "bg-white/10 text-muted"
                            : "bg-emerald-400/15 text-emerald-300"
                        }`}
                      >
                        {STAGE_LABEL[s.stage] ?? s.stage}
                      </span>
                    </button>
                    <button
                      onClick={() => removeSession(s.code)}
                      aria-label={`Hapus sesi ${s.code}`}
                      className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px] text-muted opacity-70 transition hover:text-red-300 group-hover:opacity-100"
                    >
                      <span aria-hidden="true">✕</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {active && (
              <>
                <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard tone="cyan" icon="👥" label="Peserta" value={active.participants.length} />
                  <StatCard
                    tone="violet"
                    icon="⭐"
                    label="Rata-rata Skor"
                    value={(
                      active.participants.reduce((a, p) => a + p.score, 0) /
                      (active.participants.length || 1)
                    ).toFixed(1)}
                  />
                  <StatCard
                    tone="amber"
                    icon="🎯"
                    label="Akurasi"
                    value={`${pct(
                      active.participants.reduce((a, p) => a + p.correct, 0),
                      active.participants.reduce((a, p) => a + p.answered, 0),
                    )}%`}
                  />
                  <StatCard
                    tone="emerald"
                    icon="🏁"
                    label="Jumlah Soal"
                    value={active.total}
                  />
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span>📚 {systemName(active.system)}</span>
                  <span>
                    🕒 {new Date(active.createdAt).toLocaleString("id-ID")}
                  </span>
                  <span>{STAGE_LABEL[active.stage] ?? active.stage}</span>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                  <Panel title="Hasil Peserta" subtitle={`${roster.length} siswa`}>
                    {roster.length === 0 ? (
                      <p className="text-sm text-muted">Belum ada siswa yang bergabung.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] border-collapse text-sm">
                          <caption className="sr-only">
                            Hasil peserta sesi {active.code}
                          </caption>
                          <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
                              <th scope="col" className="pb-2 font-semibold">#</th>
                              <th scope="col" className="pb-2 font-semibold">Nama Siswa</th>
                              <th scope="col" className="pb-2 text-center font-semibold">Skor</th>
                              <th scope="col" className="pb-2 text-center font-semibold">Dijawab</th>
                              <th scope="col" className="pb-2 font-semibold">Akurasi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roster.map((p, i) => {
                              const a = pct(p.correct, p.answered);
                              return (
                                <tr
                                  key={p.id}
                                  className="border-t border-white/5 transition hover:bg-white/[0.04]"
                                >
                                  <td className="py-2.5 pr-2 font-mono text-xs text-muted">
                                    {i + 1}
                                  </td>
                                  <td className="py-2.5 pr-3">
                                    <div className="flex items-center gap-2">
                                      <span className="grid h-7 w-7 place-items-center rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] font-bold font-mono text-cyan-300">
                                        {p.name.slice(0, 1).toUpperCase()}
                                      </span>
                                      <span className="font-medium">{p.name}</span>
                                      {!p.connected && (
                                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-muted">
                                          keluar
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 text-center font-mono font-bold">
                                    {p.score}/{active.total}
                                  </td>
                                  <td className="py-2.5 text-center font-mono text-xs text-muted">
                                    {p.answered}
                                  </td>
                                   <td className="py-2.5">
                                     <div className="flex items-center gap-2">
                                       <div
                                         role="progressbar"
                                         aria-label={`Akurasi ${p.name}`}
                                         aria-valuemin={0}
                                         aria-valuemax={100}
                                         aria-valuenow={a}
                                         className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10"
                                       >
                                         <div
                                           className="h-full rounded-full"
                                           style={{
                                             width: `${a}%`,
                                             background:
                                               a >= 75 ? "#34d399" : a >= 50 ? "#fbbf24" : "#f87171",
                                           }}
                                         />
                                       </div>
                                       <span className="font-mono text-xs">{a}%</span>
                                     </div>
                                   </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Panel>

                  <Panel title="Peringkat Gabungan" subtitle="Total benar dari semua sesi">
                    {aggregate.length === 0 ? (
                      <p className="text-sm text-muted">Belum ada data.</p>
                    ) : (
                      <div className="space-y-2">
                        {aggregate.slice(0, 12).map((s, i) => (
                          <div
                            key={s.name}
                            className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2"
                          >
                            <span
                              className={`w-6 text-center font-mono text-sm font-bold ${
                                i === 0 ? "text-amber-300" : i < 3 ? "text-cyan-300" : "text-muted"
                              }`}
                            >
                              {i + 1}
                            </span>
                            <span className="flex-1 truncate font-semibold">{s.name}</span>
                            <span className="text-xs text-muted">{s.sessions} sesi</span>
                            <span className="font-mono text-sm font-bold">{s.correct}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>
                </div>

                {active.questionStats && active.questionStats.length > 0 && (
                  <div className="mt-4">
                    <Panel
                      title="Rekap per Soal"
                      subtitle="Persentase siswa yang menjawab benar pada tiap soal"
                    >
                      <div className="space-y-2">
                        {active.questionStats.map((q) => {
                          const a = pct(q.correct, q.answered);
                          return (
                            <div
                              key={q.index}
                              className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                            >
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 font-mono text-xs text-muted">
                                  {q.index + 1}.
                                </span>
                                <span className="flex-1 text-sm">{q.prompt}</span>
                                <span className="whitespace-nowrap font-mono text-xs">
                                  {q.correct}/{q.answered} · {a}%
                                </span>
                              </div>
                              <div
                                role="progressbar"
                                aria-label={`Akurasi soal ${q.index + 1}`}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={a}
                                className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${a}%`,
                                    background:
                                      a >= 75 ? "#34d399" : a >= 50 ? "#fbbf24" : "#f87171",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Panel>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  tone,
  icon,
  label,
  value,
}: {
  tone: keyof typeof STAT_ACCENT;
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm backdrop-blur-md transition-all ${STAT_ACCENT[tone]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">{label}</span>
        <span className="text-base" aria-hidden="true">{icon}</span>
      </div>
      <div className="font-mono text-2xl font-bold tracking-tight text-slate-100">{value}</div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md ${className}`}>
      <div className="mb-4">
        <h2 className="font-display text-base font-bold text-slate-100 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
