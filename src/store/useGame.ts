import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BADGES } from "../data/badges";
import { ORGAN_BY_ID, ORGANS } from "../data/organs";
import { socket } from "../realtime/socket";
import { useAuth } from "./useAuth";

type Toast = { id: number; icon: string; title: string; desc?: string };

export type StudentServerProfile = {
  key: string;
  name: string;
  kelas: string;
  pin?: string;
  xp: number;
  coins: number;
  streak: number;
  lastActiveDay: string | null;
  discovered: string[];
  badges: string[];
  correctStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  missionsPlayed: number;
  missionBestScore: number;
  quizzesCompleted: number;
  quizBestScore: number;
  liveSessionsCount: number;
  createdAt: number;
  updatedAt: number;
};

export type EvaluationBreakdown = {
  explorePct: number;
  missionPct: number;
  quizPct: number;
  finalScore: number;
  grade: "A" | "B" | "C" | "D";
};

export function computeEvaluation(input: {
  discoveredCount: number;
  missionBestScore: number;
  totalCorrect: number;
  totalAnswered: number;
}): EvaluationBreakdown {
  const explorePct = Math.min(
    100,
    Math.round((input.discoveredCount / Math.max(1, ORGANS.length)) * 100),
  );
  const missionPct = Math.min(100, Math.round((input.missionBestScore / 200) * 100));
  const quizPct =
    input.totalAnswered > 0
      ? Math.min(100, Math.round((input.totalCorrect / input.totalAnswered) * 100))
      : 0;
  const finalScore = Math.round(0.3 * explorePct + 0.3 * missionPct + 0.4 * quizPct);
  const grade: "A" | "B" | "C" | "D" =
    finalScore >= 85 ? "A" : finalScore >= 75 ? "B" : finalScore >= 60 ? "C" : "D";
  return { explorePct, missionPct, quizPct, finalScore, grade };
}

type GameState = {
  studentName: string | null;
  studentPin: string | null;
  studentClass: string;
  loginModalOpen: boolean;
  loginModalInitialTab: "student" | "teacher";

  xp: number;
  coins: number;
  streak: number;
  lastActiveDay: string | null;
  discovered: string[];
  badges: string[];
  correctStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  missionsPlayed: number;
  missionBestScore: number;
  quizzesCompleted: number;
  quizBestScore: number;
  liveSessionsCount: number;
  toasts: Toast[];

  openLoginModal: (tab?: "student" | "teacher") => void;
  closeLoginModal: () => void;
  loginStudent: (
    name: string,
    pin: string,
    kelas?: string,
  ) => Promise<{ ok: boolean; error?: string; isNew?: boolean }>;
  logoutStudent: () => void;
  syncToServer: () => void;

  addXp: (n: number) => void;
  addCoins: (n: number) => void;
  discover: (organId: string) => void;
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
  awardBadge: (id: string) => void;
  recordAnswer: (correct: boolean) => void;
  recordMissionFinish: (score: number) => void;
  recordQuizFinish: (scorePct: number) => void;
  registerDaily: () => void;
  reset: () => void;
};

export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1;
export const xpForLevel = (level: number) => Math.pow(level - 1, 2) * 50;
export const xpProgress = (xp: number) => {
  const level = levelFromXp(xp);
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, start, next, pct: Math.min(100, ((xp - start) / (next - start)) * 100) };
};

let toastId = 0;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSync(get: () => GameState) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    get().syncToServer();
  }, 180);
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      studentName: null,
      studentPin: null,
      studentClass: "",
      loginModalOpen: false,
      loginModalInitialTab: "student",

      xp: 0,
      coins: 0,
      streak: 0,
      lastActiveDay: null,
      discovered: [],
      badges: [],
      correctStreak: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      missionsPlayed: 0,
      missionBestScore: 0,
      quizzesCompleted: 0,
      quizBestScore: 0,
      liveSessionsCount: 0,
      toasts: [],

      openLoginModal: (tab = "student") =>
        set({ loginModalOpen: true, loginModalInitialTab: tab }),
      closeLoginModal: () => set({ loginModalOpen: false }),

      loginStudent: (name, pin, kelas = "") =>
        new Promise((resolve) => {
          const cleanName = name.trim().replace(/\s+/g, " ").slice(0, 32);
          const cleanPin = pin.trim().replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
          const cleanKelas = kelas.trim().replace(/\s+/g, " ").slice(0, 24);
          if (cleanName.length < 2) {
            resolve({ ok: false, error: "Nama siswa minimal 2 karakter." });
            return;
          }
          if (cleanPin.length < 4) {
            resolve({ ok: false, error: "PIN siswa minimal 4 karakter/angka." });
            return;
          }

          const s = get();
          // Hanya kirim progress jika user sebelumnya memang sudah login sebagai siswa yang sama.
          // Tamu/Guest (studentName null) TIDAK boleh mengirimkan progress kotor ke akun siswa baru.
          const isSameStudent = Boolean(
            s.studentName &&
            s.studentName.trim().toLowerCase() === cleanName.toLowerCase(),
          );

          const localProgress = isSameStudent
            ? {
                xp: s.xp,
                coins: s.coins,
                streak: s.streak || 1,
                lastActiveDay: s.lastActiveDay ?? new Date().toDateString(),
                discovered: s.discovered,
                badges: s.badges,
                correctStreak: s.correctStreak,
                totalCorrect: s.totalCorrect,
                totalAnswered: s.totalAnswered,
                missionsPlayed: s.missionsPlayed,
                missionBestScore: s.missionBestScore,
                quizzesCompleted: s.quizzesCompleted,
                quizBestScore: s.quizBestScore,
              }
            : undefined;

          const timer = setTimeout(() => {
            resolve({ ok: false, error: "Koneksi ke server lambat. Coba lagi." });
          }, 5000);

          socket.emit(
            "student:login",
            {
              name: cleanName,
              pin: cleanPin,
              kelas: cleanKelas,
              progress: localProgress,
            },
            (res: {
              ok: boolean;
              isNew?: boolean;
              error?: string;
              student?: StudentServerProfile;
            }) => {
              clearTimeout(timer);
              if (!res?.ok || !res.student) {
                resolve({ ok: false, error: res?.error ?? "Gagal masuk." });
                return;
              }
              const st = res.student;

              // Pastikan peran Guru terkunci/direset saat login sebagai Siswa
              useAuth.getState().lock();

              if (res.isNew) {
                // Siswa baru WAJIB mulai dari 0 XP, 0 koin, belum ada organ/misi yang selesai
                set({
                  studentName: st.name,
                  studentPin: cleanPin,
                  studentClass: st.kelas || cleanKelas,
                  loginModalOpen: false,
                  xp: 0,
                  coins: 0,
                  streak: 1,
                  lastActiveDay: new Date().toDateString(),
                  discovered: [],
                  badges: [],
                  correctStreak: 0,
                  totalCorrect: 0,
                  totalAnswered: 0,
                  missionsPlayed: 0,
                  missionBestScore: 0,
                  quizzesCompleted: 0,
                  quizBestScore: 0,
                  liveSessionsCount: 0,
                });
              } else {
                set({
                  studentName: st.name,
                  studentPin: cleanPin,
                  studentClass: st.kelas || cleanKelas,
                  loginModalOpen: false,
                  xp: st.xp,
                  coins: st.coins,
                  streak: st.streak || 1,
                  lastActiveDay: st.lastActiveDay,
                  discovered: st.discovered,
                  badges: st.badges,
                  correctStreak: st.correctStreak,
                  totalCorrect: st.totalCorrect,
                  totalAnswered: st.totalAnswered,
                  missionsPlayed: st.missionsPlayed,
                  missionBestScore: st.missionBestScore,
                  quizzesCompleted: st.quizzesCompleted,
                  quizBestScore: st.quizBestScore,
                  liveSessionsCount: st.liveSessionsCount || 0,
                });
              }

              get().toast({
                icon: "🎓",
                title: res.isNew
                  ? `Akun ${st.name} terdaftar!`
                  : `Selamat datang kembali, ${st.name}!`,
                desc: "Progres & evaluasi tersinkron ke server Guru.",
              });
              resolve({ ok: true, isNew: res.isNew });
            },
          );
        }),

      logoutStudent: () => {
        get().syncToServer();
        useAuth.getState().lock();
        set({
          studentName: null,
          studentPin: null,
          studentClass: "",
          loginModalOpen: false,
          xp: 0,
          coins: 0,
          streak: 0,
          lastActiveDay: null,
          discovered: [],
          badges: [],
          correctStreak: 0,
          totalCorrect: 0,
          totalAnswered: 0,
          missionsPlayed: 0,
          missionBestScore: 0,
          quizzesCompleted: 0,
          quizBestScore: 0,
          liveSessionsCount: 0,
        });
      },

      syncToServer: () => {
        const s = get();
        if (!s.studentName || !s.studentPin) return;
        socket.emit("student:sync", {
          name: s.studentName,
          pin: s.studentPin,
          kelas: s.studentClass,
          progress: {
            xp: s.xp,
            coins: s.coins,
            streak: s.streak,
            lastActiveDay: s.lastActiveDay,
            discovered: s.discovered,
            badges: s.badges,
            correctStreak: s.correctStreak,
            totalCorrect: s.totalCorrect,
            totalAnswered: s.totalAnswered,
            missionsPlayed: s.missionsPlayed,
            missionBestScore: s.missionBestScore,
            quizzesCompleted: s.quizzesCompleted,
            quizBestScore: s.quizBestScore,
          },
        });
      },

      toast: (t) => {
        const id = ++toastId;
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        setTimeout(() => get().dismissToast(id), 3800);
      },
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      addXp: (n) => {
        if (!get().studentName) return;
        const before = levelFromXp(get().xp);
        set((s) => ({ xp: s.xp + n }));
        const after = levelFromXp(get().xp);
        if (after > before) {
          get().toast({
            icon: "⭐",
            title: `Naik ke Level ${after}!`,
            desc: "Terus semangat menjelajah.",
          });
          if (after >= 5) get().awardBadge("level-5");
        }
        scheduleSync(get);
      },

      addCoins: (n) => {
        if (!get().studentName) return;
        set((s) => ({ coins: s.coins + n }));
        if (get().coins >= 500) get().awardBadge("coin-500");
        scheduleSync(get);
      },

      discover: (organId) => {
        if (!get().studentName) return;
        if (get().discovered.includes(organId)) return;
        set((s) => ({ discovered: [...s.discovered, organId] }));
        get().addXp(25);
        get().addCoins(15);
        get().awardBadge("first-step");
        if (get().discovered.length >= 5) get().awardBadge("explorer-5");
        if (get().discovered.length >= 10) get().awardBadge("explorer-10");
        if (organId === "heart") get().awardBadge("heart-master");
        if (organId === "brain") get().awardBadge("brain-master");
        const systems = new Set(
          get()
            .discovered.map((id) => ORGAN_BY_ID[id]?.system)
            .filter(Boolean),
        );
        if (systems.size >= new Set(ORGANS.map((o) => o.system)).size) {
          get().awardBadge("all-systems");
        }
        scheduleSync(get);
      },

      awardBadge: (id) => {
        if (!get().studentName) return;
        if (get().badges.includes(id)) return;
        const badge = BADGES.find((b) => b.id === id);
        if (!badge) return;
        set((s) => ({ badges: [...s.badges, id] }));
        get().toast({ icon: badge.icon, title: "Badge Baru!", desc: badge.name });
        get().addCoins(50);
        scheduleSync(get);
      },

      recordAnswer: (correct) => {
        if (!get().studentName) return;
        set((s) => ({
          totalAnswered: s.totalAnswered + 1,
          totalCorrect: s.totalCorrect + (correct ? 1 : 0),
          correctStreak: correct ? s.correctStreak + 1 : 0,
        }));
        if (correct) {
          get().addXp(10);
          get().addCoins(5);
          if (get().correctStreak >= 5) get().awardBadge("quiz-ace");
        }
        scheduleSync(get);
      },

      recordMissionFinish: (score) => {
        if (!get().studentName) return;
        set((s) => ({
          missionsPlayed: s.missionsPlayed + 1,
          missionBestScore: Math.max(s.missionBestScore, score),
        }));
        scheduleSync(get);
      },

      recordQuizFinish: (scorePct) => {
        if (!get().studentName) return;
        set((s) => ({
          quizzesCompleted: s.quizzesCompleted + 1,
          quizBestScore: Math.max(s.quizBestScore, Math.round(scorePct)),
        }));
        scheduleSync(get);
      },

      registerDaily: () => {
        if (!get().studentName) return;
        const today = new Date().toDateString();
        const last = get().lastActiveDay;
        if (last === today) return;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const nextStreak = last === yesterday ? get().streak + 1 : 1;
        set({ streak: nextStreak, lastActiveDay: today });
        if (nextStreak >= 3) get().awardBadge("streak-3");
        scheduleSync(get);
      },

      reset: () =>
        set({
          xp: 0,
          coins: 0,
          streak: 0,
          discovered: [],
          badges: [],
          correctStreak: 0,
          totalCorrect: 0,
          totalAnswered: 0,
          missionsPlayed: 0,
          missionBestScore: 0,
          quizzesCompleted: 0,
          quizBestScore: 0,
          liveSessionsCount: 0,
        }),
    }),
    {
      name: "anatomi-verse-v1",
      partialize: (s) => ({
        studentName: s.studentName,
        studentPin: s.studentPin,
        studentClass: s.studentClass,
        xp: s.xp,
        coins: s.coins,
        streak: s.streak,
        lastActiveDay: s.lastActiveDay,
        discovered: s.discovered,
        badges: s.badges,
        correctStreak: s.correctStreak,
        totalCorrect: s.totalCorrect,
        totalAnswered: s.totalAnswered,
        missionsPlayed: s.missionsPlayed,
        missionBestScore: s.missionBestScore,
        quizzesCompleted: s.quizzesCompleted,
        quizBestScore: s.quizBestScore,
        liveSessionsCount: s.liveSessionsCount,
      }),
    },
  ),
);

socket.on("connect", () => {
  const s = useGame.getState();
  if (s.studentName && s.studentPin) {
    s.syncToServer();
  }
});
