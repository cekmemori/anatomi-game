import { create } from "zustand";

type PwaState = {
  offlineReady: boolean;
  needRefresh: boolean;
  online: boolean;
  updateSW: ((reload?: boolean) => Promise<void>) | null;
  setOfflineReady: (v: boolean) => void;
  setNeedRefresh: (v: boolean) => void;
  setOnline: (v: boolean) => void;
  setUpdateSW: (fn: (reload?: boolean) => Promise<void>) => void;
};

export const usePwa = create<PwaState>((set) => ({
  offlineReady: false,
  needRefresh: false,
  online: true,
  updateSW: null,
  setOfflineReady: (offlineReady) => set({ offlineReady }),
  setNeedRefresh: (needRefresh) => set({ needRefresh }),
  setOnline: (online) => set({ online }),
  setUpdateSW: (updateSW) => set({ updateSW }),
}));
