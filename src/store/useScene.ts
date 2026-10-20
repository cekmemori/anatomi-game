import { create } from "zustand";

type SceneMetrics = {
  height: number;
  xs: number;
  centers: Record<string, [number, number, number]>;
  setMeasure: (height: number, xs: number) => void;
  setCenters: (entries: Record<string, [number, number, number]>) => void;
};

export const useScene = create<SceneMetrics>((set, get) => ({
  height: 1.8,
  xs: 1,
  centers: {},
  setMeasure: (height, xs) => set({ height, xs }),
  setCenters: (entries) => {
    Object.assign(get().centers, entries);
  },
}));
