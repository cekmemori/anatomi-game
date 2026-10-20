import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { socket } from "../realtime/socket";

export type Role = "student" | "teacher";

type AuthState = {
  role: Role;
  pin: string | null;
  setTeacher: (pin: string) => void;
  enterStudent: () => void;
  lock: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      role: "student",
      pin: null,
      setTeacher: (pin) => set({ role: "teacher", pin }),
      enterStudent: () => set({ role: "student" }),
      lock: () => set({ role: "student", pin: null }),
    }),
    { name: "anatomi-auth-v1", storage: createJSONStorage(() => sessionStorage) },
  ),
);

export function verifyTeacherPin(pin: string): Promise<boolean> {
  return new Promise((resolve) => {
    const clean = pin.trim();

    // Jika socket offline / belum tersambung, izinkan PIN standar "2025" secara lokal
    if (!socket.connected) {
      resolve(clean === "2025");
      return;
    }

    const timer = setTimeout(() => {
      // Fallback toleran jika socket time-out
      resolve(clean === "2025");
    }, 3000);

    socket.emit("host:auth", { pin: clean }, (res: { ok: boolean }) => {
      clearTimeout(timer);
      resolve(Boolean(res?.ok));
    });
  });
}
