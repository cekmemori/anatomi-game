import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SystemId } from "../data/organs";

export type Participant = {
  id: string;
  name: string;
  score: number;
  answered: number;
  correct: number;
  connected: boolean;
};

export type QuestionStat = {
  index: number;
  prompt: string;
  correct: number;
  answered: number;
};

export type SessionRecord = {
  code: string;
  title: string;
  system: SystemId | "all";
  stage: string;
  total: number;
  createdAt: number;
  updatedAt: number;
  participants: Participant[];
  questionStats?: QuestionStat[];
};

type TeacherState = {
  sessions: SessionRecord[];
  saveSession: (s: Omit<SessionRecord, "createdAt" | "updatedAt">) => void;
  removeSession: (code: string) => void;
  clearAll: () => void;
};

export const useTeacher = create<TeacherState>()(
  persist(
    (set) => ({
      sessions: [],

      saveSession: (incoming) =>
        set((st) => {
          const now = Date.now();
          const idx = st.sessions.findIndex((x) => x.code === incoming.code);
          if (idx >= 0) {
            const arr = [...st.sessions];
            arr[idx] = { ...arr[idx], ...incoming, updatedAt: now };
            return { sessions: arr.sort((a, b) => b.updatedAt - a.updatedAt) };
          }
          const rec: SessionRecord = { ...incoming, createdAt: now, updatedAt: now };
          return { sessions: [rec, ...st.sessions] };
        }),

      removeSession: (code) =>
        set((st) => ({ sessions: st.sessions.filter((s) => s.code !== code) })),

      clearAll: () => set({ sessions: [] }),
    }),
    { name: "anatomi-sessions-v1" },
  ),
);

export const pct = (correct: number, answered: number) =>
  answered ? Math.round((correct / answered) * 100) : 0;
