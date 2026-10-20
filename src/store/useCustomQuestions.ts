import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Quiz } from "../data/quizzes";

type CustomState = {
  questions: Quiz[];
  add: (q: Omit<Quiz, "id">) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCustomQuestions = create<CustomState>()(
  persist(
    (set) => ({
      questions: [],
      add: (q) =>
        set((s) => ({
          questions: [
            ...s.questions,
            {
              ...q,
              id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            },
          ],
        })),
      remove: (id) => set((s) => ({ questions: s.questions.filter((q) => q.id !== id) })),
      clear: () => set({ questions: [] }),
    }),
    { name: "anatomi-custom-questions-v1" },
  ),
);
