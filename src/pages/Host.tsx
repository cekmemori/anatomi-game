import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import * as QRCode from "qrcode";
import { socket } from "../realtime/socket";
import { QUIZZES, Quiz } from "../data/quizzes";
import { SYSTEMS, SystemId } from "../data/organs";
import { useTeacher } from "../store/useTeacher";
import { useAuth } from "../store/useAuth";
import { useCustomQuestions } from "../store/useCustomQuestions";
import { copyText } from "../lib/clipboard";
import { downloadCsv } from "../lib/csv";
import Countdown from "../components/Countdown";
import CustomQuestions from "../components/CustomQuestions";

type Stage = "lobby" | "study" | "quiz" | "ended";

type StudentRow = {
  id: string;
  name: string;
  score: number;
  answered: number;
  connected: boolean;
  answers: Record<string, { choice: number; correct: boolean }>;
};

type HostState = {
  code: string;
  stage: Stage;
  qIndex: number;
  total: number;
  revealed: boolean;
  students: StudentRow[];
};

type HostQuestion = {
  index: number;
  total: number;
  revealed: boolean;
  qEndsAt: number;
  question: { prompt: string; options: string[] } | null;
  correctIndex: number | null;
  explain: string | null;
};

type HostQItem = {
  index: number;
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
  system: string;
};

type HostSaved = { code: string; token: string };
const HOST_KEY = "anatomi-host-v1";

function loadHostSession(): HostSaved | null {
  try {
    const raw = sessionStorage.getItem(HOST_KEY);
    if (raw) return JSON.parse(raw) as HostSaved;
  } catch {
    /* ignore */
  }
  return null;
}
function saveHostSession(s: HostSaved) {
  try {
    sessionStorage.setItem(HOST_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
function clearHostSession() {
  try {
    sessionStorage.removeItem(HOST_KEY);
  } catch {
    /* ignore */
  }
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const COUNTS = [5, 10, 15, 20];

export default function Host() {
  const [connected, setConnected] = useState(socket.connected);
  const [scope, setScope] = useState<SystemId | "all" | "custom">("all");
  const [count, setCount] = useState(10);
  const [state, setState] = useState<HostState | null>(null);
  const [hq, setHq] = useState<HostQuestion | null>(null);
  const [qs, setQs] = useState<HostQItem[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [qr, setQr] = useState("");
  const [duration, setDuration] = useState(30);
  const [resuming, setResuming] = useState(() => Boolean(loadHostSession()));
  const [presenting, setPresenting] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const codeRef = useRef<string | null>(null);
  const projectorRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const saveSession = useTeacher((s) => s.saveSession);
  const pin = useAuth((s) => s.pin);
  const customQuestions = useCustomQuestions((s) => s.questions);

  useEffect(() => {
    const saved = loadHostSession();
    if (saved) {
      tokenRef.current = saved.token;
      codeRef.current = saved.code;
    }

    const tryResume = () => {
      if (!tokenRef.current || !codeRef.current) return;
      socket.emit(
        "host:resume",
        { code: codeRef.current, token: tokenRef.current },
        (res: { ok: boolean }) => {
          if (!res?.ok) {
            clearHostSession();
            tokenRef.current = null;
            codeRef.current = null;
          }
          setResuming(false);
        },
      );
    };

    const onConnect = () => {
      setConnected(true);
      tryResume();
    };
    const onDisconnect = () => setConnected(false);
    const onUpdate = (d: HostState) => setState(d);
    const onQ = (d: HostQuestion) => setHq(d);
    const onQList = (d: { durationMs?: number; questions?: HostQItem[] }) => {
      setQs(Array.isArray(d?.questions) ? d.questions : []);
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("host:update", onUpdate);
    socket.on("host:question", onQ);
    socket.on("host:questionlist", onQList);
    if (socket.connected) tryResume();
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("host:update", onUpdate);
      socket.off("host:question", onQ);
      socket.off("host:questionlist", onQList);
    };
  }, []);

  useEffect(() => {
    if (state?.code) codeRef.current = state.code;
  }, [state?.code]);

  useEffect(() => {
    if (!presenting) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const node = projectorRef.current;
    node?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPresenting(false);
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const focusables = node.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      restoreFocusRef.current?.focus?.();
    };
  }, [presenting]);

  const availableScopes = useMemo(
    () => Object.values(SYSTEMS).filter((s) => QUIZZES.some((q) => q.system === s.id)),
    [],
  );

  // Simpan rekap sesi secara otomatis (live) ke store guru.
  useEffect(() => {
    if (!state) return;
    const label =
      scope === "all"
        ? "Semua Sistem"
        : scope === "custom"
          ? "Soal Kustom"
          : SYSTEMS[scope]?.name ?? scope;
    const questionStats = (qs.length
      ? qs
      : Array.from({ length: state.total }, (_, i) => ({
          index: i,
          prompt: `Soal ${i + 1}`,
          options: [] as string[],
          answer: 0,
          explain: "",
          system: "",
        }))
    ).map((q) => {
      let correct = 0;
      let answered = 0;
      for (const s of state.students) {
        const a = s.answers[q.index];
        if (a) {
          answered += 1;
          if (a.correct) correct += 1;
        }
      }
      return { index: q.index, prompt: q.prompt, correct, answered };
    });
    saveSession({
      code: state.code,
      title: `${label} · ${state.total || count} soal`,
      system: scope === "custom" ? "all" : scope,
      stage: state.stage,
      total: state.total || count,
      participants: state.students.map((s) => ({
        id: s.id,
        name: s.name,
        score: s.score,
        answered: s.answered,
        correct: Object.values(s.answers).filter((a) => a.correct).length,
        connected: s.connected,
      })),
      questionStats,
    });
  }, [state, scope, count, qs, saveSession]);

  const joinUrl = state ? `${window.location.origin}/join?code=${state.code}` : "";

  useEffect(() => {
    if (!joinUrl) {
      setQr("");
      return;
    }
    QRCode.toDataURL(joinUrl, {
      margin: 1,
      width: 260,
      color: { dark: "#0b1220", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [joinUrl]);

  const buildQuestions = useCallback((): Quiz[] => {
    if (scope === "custom" && customQuestions.length > 0) {
      return shuffle(customQuestions).slice(0, Math.min(count, customQuestions.length));
    }
    const base = scope === "all" || scope === "custom" ? QUIZZES : QUIZZES.filter((q) => q.system === scope);
    if (scope === "all" && customQuestions.length > 0) {
      const combined = [...shuffle(customQuestions), ...shuffle(base)];
      return combined.slice(0, Math.min(count, combined.length));
    }
    const src = base.length ? base : QUIZZES;
    return shuffle(src).slice(0, Math.min(count, src.length));
  }, [scope, count, customQuestions]);

  const createSession = () => {
    setCreateError(null);
    socket.emit(
      "host:create",
      { pin, durationMs: duration * 1000 },
      (res: { ok: boolean; code?: string; token?: string; error?: string }) => {
        if (!res?.ok || !res.code || !res.token) {
          setCreateError(res?.error ?? "Gagal membuat sesi. Pastikan server menyala.");
          return;
        }
        tokenRef.current = res.token;
        codeRef.current = res.code;
        saveHostSession({ code: res.code, token: res.token });
        const questions = buildQuestions();
        socket.emit("host:questions", {
          code: res.code,
          token: res.token,
          questions,
        });
        setState({
          code: res.code,
          stage: "lobby",
          qIndex: -1,
          total: questions.length,
          revealed: false,
          students: [],
        });
        setHq({
          index: -1,
          total: questions.length,
          revealed: false,
          qEndsAt: 0,
          question: null,
          correctIndex: null,
          explain: null,
        });
      },
    );
  };

  const changeDuration = (n: number) => {
    setDuration(n);
    if (state && tokenRef.current) {
      socket.emit("host:config", {
        code: state.code,
        token: tokenRef.current,
        durationMs: n * 1000,
      });
    }
  };

  const setStage = (stage: Stage) =>
    socket.emit("host:stage", { code: state!.code, token: tokenRef.current, stage });
  const next = () => socket.emit("host:next", { code: state!.code, token: tokenRef.current });
  const prev = () => socket.emit("host:prev", { code: state!.code, token: tokenRef.current });
  const reveal = () =>
    socket.emit("host:reveal", { code: state!.code, token: tokenRef.current });
  const end = () => {
    clearHostSession();
    socket.emit("host:end", { code: state!.code, token: tokenRef.current });
  };
  const resetToSetup = () => {
    clearHostSession();
    tokenRef.current = null;
    codeRef.current = null;
    setState(null);
    setHq(null);
    setQs([]);
  };
  const kick = (id: string) =>
    socket.emit("host:kickstudent", {
      code: state!.code,
      token: tokenRef.current,
      studentId: id,
    });

  const copy = async (text: string, tag: string) => {
    const ok = await copyText(text);
    if (!ok) {
      window.prompt("Salin manual:", text);
      return;
    }
    setCopied(tag);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const exportCsv = () => {
    if (!state) return;
    downloadCsv(`hasil-sesi-${state.code}.csv`, [
      ["Nama", "Skor", "Terjawab", "Benar"],
      ...state.students.map((s) => [
        s.name,
        s.score,
        s.answered,
        Object.values(s.answers).filter((a) => a.correct).length,
      ]),
    ]);
  };

  if (!state) {
    if (resuming) {
      return (
        <div className="flex h-full min-h-0 w-full flex-col justify-center overflow-y-auto px-4 pb-8">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/90 p-8 text-center shadow-2xl backdrop-blur-xl" role="status">
            <div className="animate-pulse text-4xl" aria-hidden="true">📡</div>
            <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-white">
              Menyambungkan kembali sesi…
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">Memulihkan data sesi instruktur terakhir Anda.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 py-3 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="m-auto w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-start gap-4">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cyan-500/20 bg-cyan-950/30 text-2xl text-cyan-400"
              aria-hidden="true"
            >
              📡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Ruang Kelas Terkoneksi</span>
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Sesi Kuis Live Board
              </h1>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Buat sesi interaktif untuk kelas, bagikan kode ke siswa, lalu pandu pembelajaran mandiri atau jalankan kuis bertempo.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
            <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cakupan Materi Anatomi
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Chip active={scope === "all"} onClick={() => setScope("all")}>
                🔥 Semua Sistem
              </Chip>
              {customQuestions.length > 0 && (
                <Chip active={scope === "custom"} onClick={() => setScope("custom")}>
                  ✏️ Soal Kustom ({customQuestions.length})
                </Chip>
              )}
              {availableScopes.map((s) => (
                <Chip key={s.id} active={scope === s.id} onClick={() => setScope(s.id)}>
                  {s.icon} {s.name}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.35fr]">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
              <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Jumlah Soal
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {COUNTS.map((c) => (
                  <Chip key={c} active={count === c} onClick={() => setCount(c)}>
                    {c} soal
                  </Chip>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
              <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Timer per Soal
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {[0, 20, 30, 45, 60].map((t) => (
                  <Chip key={t} active={duration === t} onClick={() => setDuration(t)}>
                    {t === 0 ? "Tanpa timer" : `${t} detik`}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {customQuestions.length > 0 && scope === "all" && (
            <p className="mt-3 text-xs text-slate-400">
              + {customQuestions.length} soal kustom diprioritaskan di dalam sesi ini.
            </p>
          )}

          <CustomQuestions />

          {!connected && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-2.5 text-xs text-amber-300">
              Tidak terhubung ke server. Pastikan server web / socket aktif.
            </div>
          )}

          {createError && (
            <div role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-2.5 text-xs text-rose-300">
              {createError}
            </div>
          )}

          <button
            onClick={createSession}
            disabled={!connected}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition-all hover:bg-cyan-300 active:scale-[0.98] disabled:opacity-40"
          >
            <span>Buka Ruang Sesi Sekarang</span>
            <span>→</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const stage = state.stage;
  const answeredNow = hq?.index != null && hq.index >= 0
    ? state.students.filter((s) => s.answers[hq.index] !== undefined).length
    : 0;
  const dist = hq?.question
    ? hq.question.options.map(
        (_, i) =>
          state.students.filter((s) => hq.index >= 0 && s.answers[hq.index]?.choice === i).length,
      )
    : [];
  const maxDist = Math.max(1, ...dist);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-4 overflow-y-auto px-4 pb-4 xl:flex-row xl:overflow-hidden">
      <h1 className="sr-only">Sesi Kuis Live — kode {state.code}</h1>
      {/* Control column */}
      <div className="flex w-full shrink-0 flex-col gap-3 xl:w-96 xl:overflow-y-auto">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">Kode Sesi Kelas</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${connected ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-300"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`} />
              {connected ? "Aktif" : "Offline"}
            </span>
          </div>
          <button
            onClick={() => copy(state.code, "code")}
            aria-label={`Salin kode sesi ${state.code}`}
            className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 font-mono text-4xl font-extrabold tracking-[0.25em] text-cyan-300 transition-all hover:border-cyan-500/40 hover:bg-slate-900"
          >
            {state.code}
          </button>
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={() => copy(joinUrl, "url")}
              className="flex-1 rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
            >
              {copied === "url" ? "Tersalin ✓" : "Salin Link Siswa"}
            </button>
            <button
              onClick={() => copy(state.code, "code")}
              className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
            >
              {copied === "code" ? "✓" : "Kode"}
            </button>
          </div>
          <span className="sr-only" role="status">
            {copied ? "Kode sesi tersalin ke papan klip" : ""}
          </span>

          {qr && (
            <div className="mt-3.5 flex items-center gap-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
              <img
                src={qr}
                alt="Kode QR untuk bergabung ke sesi"
                width={96}
                height={96}
                className="rounded-lg bg-white p-1"
              />
              <div className="text-xs text-slate-400">
                <div className="font-semibold text-slate-200">Pindai Masuk Instan</div>
                <div className="mt-1 leading-relaxed">
                  Siswa dapat membuka kamera atau akses{" "}
                  <span className="font-mono text-cyan-300">{window.location.host}/join</span>.
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl border border-slate-800 bg-slate-900/50 p-1">
            <StageBtn active={stage === "lobby"} onClick={() => setStage("lobby")}>
              Lobby
            </StageBtn>
            <StageBtn active={stage === "study"} onClick={() => setStage("study")}>
              Belajar
            </StageBtn>
            <StageBtn active={stage === "quiz"} onClick={() => setStage("quiz")}>
              Kuis Live
            </StageBtn>
          </div>

          <div className="mt-3.5 flex items-center gap-2 text-xs text-slate-400">
            <label htmlFor="dur" className="font-medium">Durasi:</label>
            <select
              id="dur"
              value={duration}
              onChange={(e) => changeDuration(Number(e.target.value))}
              className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-200 outline-none focus:border-cyan-400"
            >
              {[0, 20, 30, 45, 60].map((t) => (
                <option key={t} value={t} className="bg-slate-900 text-slate-200">
                  {t === 0 ? "Tanpa batas" : `${t} detik`}
                </option>
              ))}
            </select>
            {stage === "quiz" && (
              <div className="ml-auto">
                <Countdown
                  endsAt={hq?.qEndsAt ?? 0}
                  paused={hq?.revealed}
                  total={duration * 1000}
                  compact
                />
              </div>
            )}
          </div>

          {stage === "quiz" ? (
            <div className="mt-4 flex gap-2">
              <button onClick={prev} aria-label="Soal sebelumnya" className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                ◀
              </button>
              <button onClick={next} className="flex-1 rounded-xl bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-300">
                Soal Berikutnya ▶
              </button>
              <button onClick={reveal} className="rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3 py-2 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-900/40">
                Buka Kunci
              </button>
            </div>
          ) : stage === "ended" ? (
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={resetToSetup}
                className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-md shadow-cyan-400/20 transition-all hover:bg-cyan-300 active:scale-[0.98]"
              >
                ＋ Buat Sesi Baru
              </button>
              <Link
                to="/teacher"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 text-center text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
              >
                📊 Rekapitulasi Guru
              </Link>
            </div>
          ) : (
            <button
              onClick={() => setStage(stage === "lobby" ? "study" : "quiz")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-md shadow-cyan-400/20 transition-all hover:bg-cyan-300 active:scale-[0.98]"
            >
              <span>{stage === "lobby" ? "▶ Buka Akses Belajar Mandiri" : "▶ Mulai Kuis Sekarang"}</span>
              <span>→</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPresenting(true)}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/50 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            <span aria-hidden="true">🖥️</span>
            <span>Mode Proyektor (Full Layar)</span>
          </button>

          {stage !== "ended" && (
            <button
              onClick={end}
              className="mt-2.5 w-full rounded-xl border border-rose-500/30 bg-rose-950/20 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-900/30"
            >
              Akhiri Sesi
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Preview Pertanyaan {Math.max(hq?.index ?? -1, 0) + ((hq?.index ?? -1) >= 0 ? 1 : 0)} / {state.total}
          </div>
          {hq?.question ? (
            <>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-200">{hq.question.prompt}</p>
              <div className="mt-3 space-y-1.5">
                {hq.question.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
                      hq.revealed && i === hq.correctIndex
                        ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                        : "border-slate-800/80 bg-slate-900/50 text-slate-300"
                    }`}
                  >
                    <span className="font-mono font-bold text-slate-400">{String.fromCharCode(65 + i)}</span>
                    <span className="flex-1">{opt}</span>
                    <span className="font-mono text-[11px] text-slate-400">{dist[i] ?? 0}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              {stage === "lobby"
                ? "Siswa bergabung dengan kode di atas. Buka Belajar atau Kuis untuk memulai."
                : "Tekan “Mulai Kuis” untuk memunculkan butir pertanyaan pertama."}
            </p>
          )}
        </div>
      </div>

      {/* Live board */}
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <h2 className="font-display text-base font-bold text-white">Papan Aktivitas Siswa</h2>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-xs font-mono text-slate-300">
            {state.students.length} peserta
          </span>
          {stage === "quiz" && (
            <span role="status" className="rounded-full border border-cyan-500/30 bg-cyan-950/30 px-2.5 py-0.5 text-xs font-mono text-cyan-300">
              {answeredNow}/{state.students.length} terjawab
            </span>
          )}
          <button
            onClick={exportCsv}
            className="ml-auto inline-flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            <span>⬇</span>
            <span>Export CSV</span>
          </button>
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {state.students.length === 0 && (
            <p className="mt-6 text-center text-sm text-muted">
              Belum ada siswa. Minta mereka membuka {joinUrl || "/join"} lalu masukkan kode.
            </p>
          )}
          {state.students.map((s, i) => {
            const cur = hq?.index != null && hq.index >= 0 ? s.answers[hq.index] : undefined;
            const status =
              stage !== "quiz"
                ? s.connected
                  ? "siap"
                  : "terputus"
                : cur
                  ? hq!.revealed
                    ? cur.correct
                      ? "benar"
                      : "salah"
                    : "menjawab"
                  : s.connected
                    ? "…"
                    : "terputus";
            const tone =
              status === "benar"
                ? "text-emerald-300"
                : status === "salah"
                  ? "text-red-300"
                  : status === "menjawab"
                    ? "text-cyan-300"
                    : "text-muted";
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 px-3.5 py-2 transition-colors hover:bg-slate-900/80"
              >
                <span className="w-6 text-center font-mono text-xs font-bold text-slate-400">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-xs font-semibold text-slate-200">{s.name}</span>
                <span className={`text-[11px] font-medium ${tone}`}>{status}</span>
                <span className="w-16 text-right font-mono text-[11px] text-slate-400">{s.answered} dijawab</span>
                <span className="w-10 text-right font-mono text-xs font-bold text-cyan-300">{s.score}</span>
                <button
                  onClick={() => kick(s.id)}
                  title="Keluarkan"
                  aria-label={`Keluarkan ${s.name}`}
                  className="rounded px-1 text-xs text-slate-500 hover:text-rose-400"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {stage === "quiz" && hq?.question && (
          <div
            role="img"
            aria-label={`Distribusi jawaban: ${hq.question.options
              .map((_, i) => `${String.fromCharCode(65 + i)} sebanyak ${dist[i] ?? 0}`)
              .join(", ")}`}
            className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
              Distribusi Jawaban
            </div>
            <div className="flex items-end gap-2" aria-hidden="true">
              {dist.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-lg ${
                      hq.revealed && i === hq.correctIndex ? "bg-emerald-400/70" : "bg-cyan-400/50"
                    }`}
                    style={{ height: `${Math.max(4, (v / maxDist) * 64)}px` }}
                  />
                  <span className="font-mono text-xs text-muted">{String.fromCharCode(65 + i)}</span>
                  <span className="text-xs font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {presenting &&
        createPortal(
          <div
            ref={projectorRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Mode proyektor"
            className="fixed inset-0 z-[90] flex flex-col gap-4 bg-[#070b14] p-5 outline-none md:p-8"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-extrabold tracking-[0.3em] text-cyan-200">
                {state.code}
              </span>
              <span className="text-xs text-muted">
                Soal {Math.max(hq?.index ?? -1, 0) + ((hq?.index ?? -1) >= 0 ? 1 : 0)} /{" "}
                {state.total}
              </span>
              <div className="ml-auto flex items-center gap-3">
                <Countdown
                  endsAt={hq?.qEndsAt ?? 0}
                  paused={hq?.revealed}
                  total={duration * 1000}
                  compact
                />
                <button
                  onClick={() => setPresenting(false)}
                  className="rounded-xl border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  ✕ Keluar (Esc)
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
              {hq?.question ? (
                <>
                  <h1 className="max-w-5xl font-display text-2xl font-extrabold leading-tight md:text-4xl">
                    {hq.question.prompt}
                  </h1>
                  <div className="mt-8 grid w-full max-w-4xl gap-3 md:grid-cols-2">
                    {hq.question.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-left text-base md:text-lg ${
                          hq.revealed && i === hq.correctIndex
                            ? "border-emerald-400/60 bg-emerald-400/15"
                            : "border-white/12 bg-white/[0.03]"
                        }`}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 font-mono font-bold">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                  {hq.revealed && hq.explain && (
                    <p className="mt-6 max-w-3xl text-sm text-muted">{hq.explain}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="text-6xl" aria-hidden="true">⏳</div>
                  <p className="mt-4 text-xl text-muted" role="status">
                    {state.stage === "lobby"
                      ? "Menunggu siswa bergabung…"
                      : "Menyiapkan soal…"}
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs text-muted">
                Gabung:{" "}
                <span className="font-mono text-cyan-300">{window.location.host}/join</span> ·
                kode <span className="font-mono text-cyan-300">{state.code}</span>
              </div>
              {state.students.length > 0 && (
                <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
                  {state.students.slice(0, 5).map((s, i) => (
                    <span key={s.id} className="rounded-lg bg-white/[0.05] px-2 py-1">
                      #{i + 1} {s.name} · {s.score}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={prev}
                aria-label="Soal sebelumnya"
                className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
              >
                <span aria-hidden="true">◀</span>
              </button>
              <button
                onClick={next}
                className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Soal Berikutnya <span aria-hidden="true">▶</span>
              </button>
              <button
                onClick={reveal}
                className="rounded-xl bg-cyan-400/20 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/30"
              >
                Tampilkan Jawaban
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function Chip({
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
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border px-2.5 text-center text-xs font-semibold transition-all ${
        active
          ? "border-cyan-400/60 bg-cyan-950/40 text-cyan-200 shadow-sm"
          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function StageBtn({
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
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-2 py-1.5 text-xs font-bold transition-all ${
        active ? "bg-cyan-400 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
      }`}
    >
      {children}
    </button>
  );
}
