import {
  ORGAN_FOCUS_FALLBACK,
  ORGAN_UNITS,
  transformMeters,
} from "../data/organModels";
import { useScene } from "../store/useScene";

export type Mode = "gltf" | "organ";

export const GLTF_Y_OFFSET = -0.2;
export const ORGAN_Y_OFFSET = -0.2;

export function organFocus(
  _mode: Mode,
  id: string,
  height: number,
  _xs: number,
): [number, number, number] | null {
  const dynamic = useScene.getState().centers[id];
  if (dynamic) return dynamic;
  const unit = ORGAN_UNITS.find((u) => u.ids.includes(id));
  const base = unit ? (unit.focus ?? unit.anchor) : ORGAN_FOCUS_FALLBACK[id];
  if (!base) return null;
  const flipSide = Boolean(unit && (unit.pair || unit.mirror) && unit.ids[1] === id);
  const raw: [number, number, number] = flipSide ? [-base[0], base[1], base[2]] : base;
  const p = transformMeters(raw, height);
  return [p[0], p[1] + GLTF_Y_OFFSET, p[2]];
}

export const focusDistance = (mode: Mode) => (mode === "gltf" ? 1.45 : 1.7);
