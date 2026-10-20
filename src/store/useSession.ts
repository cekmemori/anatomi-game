import { create } from "zustand";
import { socket } from "../realtime/socket";
import { useGame } from "./useGame";

export type StudentStage = "off" | "lobby" | "study" | "quiz" | "ended";

export type Question = {
  id: string;
  prompt: string;
  options: string[];
  system?: string;
};

type BoardRow = { id: string; name: string; score: number };

export type ReviewItem = {
  index: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  chosen: number | null;
  correct: boolean;
  explain: string;
};

type SessionState = {
  connected: boolean;
  joined: boolean;
  name: string;
  code: string;
  studentId: string | null;
  token: string | null;
  stage: StudentStage;
  qIndex: number;
  total: number;
  revealed: boolean;
  qEndsAt: number;
  question: Question | null;
  correctIndex: number | null;
  explain: string | null;
  yourAnswer: number | null;
  yourScore: number;
  board: BoardRow[] | null;
  review: ReviewItem[] | null;
  error: string | null;
  notice: string | null;
  join: (code: string, name: string) => void;
  answer: (choice: number) => void;
  leave: () => void;
  clearMessages: () => void;
};

const LS_KEY = "anatomi-session-v1";

type Identity = { name: string; code: string; studentId: string | null; token: string | null };

function loadIdentity(): Identity {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { name: "", code: "", studentId: null, token: null, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { name: "", code: "", studentId: null, token: null };
}

function saveIdentity(s: Identity) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const identity = loadIdentity();

export const useSession = create<SessionState>()((set, get) => ({
  connected: socket.connected,
  joined: false,
  name: identity.name,
  code: identity.code,
  studentId: identity.studentId,
  token: identity.token,
  stage: "off",
  qIndex: -1,
  total: 0,
  revealed: false,
  qEndsAt: 0,
  question: null,
  correctIndex: null,
  explain: null,
  yourAnswer: null,
  yourScore: 0,
  board: null,
  review: null,
  error: null,
  notice: null,

  join: (code, name) => {
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    set({ error: null, notice: null, name, code: clean });
    socket.emit(
      "student:join",
      { code: clean, name, studentId: get().studentId, token: get().token },
      (res: { ok: boolean; studentId?: string; token?: string; code?: string; error?: string }) => {
        if (res?.ok && res.studentId && res.token) {
          set({ joined: true, studentId: res.studentId, token: res.token, code: res.code ?? clean });
          saveIdentity({ name, code: clean, studentId: res.studentId, token: res.token });
        } else {
          set({ joined: false, error: res?.error ?? "Gagal bergabung." });
        }
      },
    );
  },

  answer: (choice) => {
    const { code, qIndex } = get();
    if (qIndex < 0) return;
    set({ yourAnswer: choice });
    socket.emit("student:answer", { code, qIndex, choice });
  },

  leave: () => {
    socket.emit("student:leave", { code: get().code });
    set({
      joined: false,
      stage: "off",
      qIndex: -1,
      qEndsAt: 0,
      question: null,
      yourAnswer: null,
      yourScore: 0,
      board: null,
      review: null,
      notice: null,
      error: null,
    });
    saveIdentity({ name: get().name, code: get().code, studentId: null, token: null });
  },

  clearMessages: () => set({ error: null, notice: null }),
}));

let bound = false;

export function bindSession() {
  if (bound) return;
  bound = true;

  socket.on("connect", () => {
    useSession.setState({ connected: true });
    const { joined, name, code, studentId, token } = useSession.getState();
    if (joined && name && code) {
      socket.emit(
        "student:join",
        { code, name, studentId, token },
        (res: { ok: boolean; studentId?: string; token?: string }) => {
          if (res?.ok && res.studentId && res.token) {
            useSession.setState({ joined: true, studentId: res.studentId, token: res.token });
            saveIdentity({ name, code, studentId: res.studentId, token: res.token });
          }
        },
      );
    }
  });

  socket.on("disconnect", () => useSession.setState({ connected: false }));

  socket.on("student:update", (data: Partial<SessionState>) => {
    useSession.setState({
      stage: data.stage ?? "lobby",
      qIndex: data.qIndex ?? -1,
      total: data.total ?? 0,
      revealed: !!data.revealed,
      qEndsAt: data.qEndsAt ?? 0,
      question: (data.question as Question) ?? null,
      correctIndex: data.correctIndex ?? null,
      explain: data.explain ?? null,
      yourAnswer: data.yourAnswer ?? null,
      yourScore: data.yourScore ?? 0,
    });
  });

  socket.on(
    "session:ended",
    ({ leaderboard, review } = { leaderboard: [], review: null }) => {
      const items = Array.isArray(review) ? (review as ReviewItem[]) : null;
      useSession.setState({
        stage: "ended",
        qEndsAt: 0,
        board: leaderboard ?? [],
        review: items,
      });
      if (items && items.length > 0) {
        const g = useGame.getState();
        let answeredCount = 0;
        let correctCount = 0;
        for (const r of items) {
          if (r.chosen !== null) {
            answeredCount += 1;
            if (r.correct) correctCount += 1;
            g.recordAnswer(r.correct);
          }
        }
        if (answeredCount > 0) {
          const pct = Math.round((correctCount / items.length) * 100);
          g.recordQuizFinish(pct);
        }
      }
    },
  );

  socket.on("session:kicked", () => {
    useSession.setState({
      joined: false,
      stage: "off",
      qEndsAt: 0,
      review: null,
      notice: "Anda dikeluarkan dari sesi.",
    });
  });

  socket.on("session:hostleft", () => {
    useSession.setState({
      joined: false,
      stage: "off",
      qEndsAt: 0,
      review: null,
      notice: "Sesi diakhiri oleh guru.",
    });
  });
}
