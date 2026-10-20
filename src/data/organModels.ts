import { SystemId } from "./organs";

export const BODY_RAW_HEIGHT = 1.69942;
const BODY_MIN_Y = 0.00811;
const BODY_CENTER_Z = 0.00344;

export type OrganUnit = {
  key: string;
  url: string;
  anchor: [number, number, number];
  ids: string[];
  system: SystemId;
  color: string;
  rot?: [number, number, number];
  mul?: number;
  pair?: true;
  mirror?: true;
  flipX?: true;
  nodeSide?: (name: string) => "left" | "right" | null;
  include?: RegExp;
  exclude?: RegExp;
  center?: "bbox" | "body";
  focus?: [number, number, number];
  markerOffset?: [number, number, number];
};

const lrSide = (name: string): "left" | "right" | null => {
  if (/^left/i.test(name)) return "left";
  if (/^right/i.test(name)) return "right";
  return null;
};

export const ORGAN_UNITS: OrganUnit[] = [
  {
    key: "brain",
    url: "/models/organs/brain.glb",
    anchor: [0, 1.608, -0.009],
    focus: [0, 1.62, -0.009],
    ids: ["brain"],
    system: "nervous",
    color: "#c084fc",
    exclude: /cerebell|brainstem|pons|medulla/i,
  },
  {
    key: "cerebellum",
    url: "/models/organs/brain.glb",
    anchor: [0, 1.608, -0.009],
    focus: [0, 1.571, -0.056],
    ids: ["cerebellum"],
    system: "nervous",
    color: "#c084fc",
    include: /cerebell/i,
  },
  {
    key: "brainstem",
    url: "/models/organs/brain.glb",
    anchor: [0, 1.608, -0.009],
    focus: [0, 1.571, -0.019],
    ids: ["brainstem"],
    system: "nervous",
    color: "#a855f7",
    include: /brainstem|pons|medulla/i,
  },
  {
    key: "spinal-cord",
    url: "/models/organs/spinal-cord.glb",
    anchor: [0, 1.185, -0.04],
    focus: [0, 1.295, -0.045],
    markerOffset: [0, 0.11, -0.005],
    ids: ["spinal-cord"],
    system: "nervous",
    color: "#c084fc",
  },
  {
    key: "heart",
    url: "/models/organs/heart.glb",
    anchor: [0.02, 1.24, 0.045],
    focus: [0.02, 1.24, 0.045],
    ids: ["heart"],
    system: "circulatory",
    color: "#f87171",
    flipX: true,
    rot: [0, -0.22, 0],
    exclude: /aorta|aortic|vena cava/i,
  },
  {
    key: "aorta",
    url: "/models/organs/heart.glb",
    anchor: [0.02, 1.24, 0.045],
    focus: [0.028, 1.278, 0.041],
    ids: ["aorta"],
    system: "circulatory",
    color: "#f87171",
    flipX: true,
    rot: [0, -0.22, 0],
    include: /aorta|aortic/i,
  },
  {
    key: "vena-cava",
    url: "/models/organs/heart.glb",
    anchor: [0.02, 1.24, 0.045],
    focus: [-0.013, 1.257, 0.024],
    ids: ["vena-cava"],
    system: "circulatory",
    color: "#60a5fa",
    flipX: true,
    rot: [0, -0.22, 0],
    include: /vena cava/i,
  },
  {
    key: "lungs",
    url: "/models/organs/lungs.glb",
    anchor: [0, 1.325, 0.005],
    focus: [-0.073, 1.299, 0.005],
    ids: ["lung-left", "lung-right"],
    system: "respiratory",
    color: "#93c5fd",
    pair: true,
    flipX: true,
    nodeSide: lrSide,
    mul: 0.9,
    exclude: /tracheal|bronch/i,
  },
  {
    key: "trachea",
    url: "/models/organs/lungs.glb",
    anchor: [0, 1.325, 0.005],
    focus: [0, 1.406, 0.027],
    ids: ["trachea"],
    system: "respiratory",
    color: "#93c5fd",
    flipX: true,
    mul: 0.9,
    include: /tracheal/i,
  },
  {
    key: "bronchus",
    url: "/models/organs/lungs.glb",
    anchor: [0, 1.325, 0.005],
    focus: [0.004, 1.318, 0.019],
    ids: ["bronchus"],
    system: "respiratory",
    color: "#60a5fa",
    flipX: true,
    mul: 0.9,
    include: /bronch/i,
  },
  {
    key: "liver",
    url: "/models/organs/liver.glb",
    anchor: [-0.045, 1.145, 0.025],
    focus: [-0.045, 1.145, 0.025],
    markerOffset: [-0.035, 0.015, 0.01],
    ids: ["liver"],
    system: "digestive",
    color: "#fbbf24",
    rot: [0, -0.12, 0],
    mul: 0.95,
  },
  {
    key: "stomach",
    url: "/models/organs/stomach.glb",
    anchor: [0.05, 1.14, 0.03],
    focus: [0.05, 1.14, 0.03],
    ids: ["stomach"],
    system: "digestive",
    color: "#f59e0b",
    rot: [0, 0.2, 0],
    mul: 0.9,
  },
  {
    key: "intestine-small",
    url: "/models/organs/intestines.glb",
    anchor: [0, 0.98, 0.02],
    focus: [-0.003, 0.96, 0.04],
    ids: ["intestines"],
    system: "digestive",
    color: "#fb923c",
    mul: 0.98,
    include: /small bowel|jejunum|ileum/i,
  },
  {
    key: "intestine-large",
    url: "/models/organs/intestines.glb",
    anchor: [0, 0.98, 0.02],
    focus: [0.085, 1.0, 0.007],
    markerOffset: [0.085, 0.02, 0.02],
    ids: ["large-intestine"],
    system: "digestive",
    color: "#f97316",
    mul: 0.98,
    include: /large intestine|colon|caecum|cecum|rectum/i,
  },
  {
    key: "appendix",
    url: "/models/organs/digestive-tract.glb",
    anchor: [0, 1.15, 0],
    focus: [-0.119, 0.923, -0.009],
    ids: ["appendix"],
    system: "digestive",
    color: "#ef4444",
    include: /appendix/i,
  },
  {
    key: "esophagus",
    url: "/models/organs/digestive-tract.glb",
    anchor: [0, 1.15, 0],
    focus: [0.015, 1.355, -0.009],
    ids: ["esophagus"],
    system: "digestive",
    color: "#fbbf24",
    include: /oesophagus|esophagus|gastric cardia/i,
  },
  {
    key: "pancreas",
    url: "/models/organs/digestive-tract.glb",
    anchor: [0, 1.15, 0],
    focus: [0.027, 1.144, -0.042],
    ids: ["pancreas"],
    system: "digestive",
    color: "#f59e0b",
    include: /pancrea/i,
  },
  {
    key: "gallbladder",
    url: "/models/organs/digestive-tract.glb",
    anchor: [0, 1.15, 0],
    focus: [-0.057, 1.144, -0.001],
    markerOffset: [-0.025, -0.04, 0.01],
    ids: ["gallbladder"],
    system: "digestive",
    color: "#84cc16",
    include: /gallbladder|hepatic duct|cystic duct|bile duct/i,
  },
  {
    key: "urinary",
    url: "/models/organs/urinary.glb",
    anchor: [0, 1.05, 0],
    focus: [0, 0.897, 0.04],
    ids: ["bladder"],
    system: "excretory",
    color: "#34d399",
    include: /bladder|urethral/i,
  },
  {
    key: "ureter-left",
    url: "/models/organs/urinary.glb",
    anchor: [0, 1.05, 0],
    focus: [0.03, 1.027, -0.002],
    ids: ["ureter-left"],
    system: "excretory",
    color: "#34d399",
    include: /Left renal pelvis and ureter/i,
  },
  {
    key: "ureter-right",
    url: "/models/organs/urinary.glb",
    anchor: [0, 1.05, 0],
    focus: [-0.03, 1.017, -0.002],
    ids: ["ureter-right"],
    system: "excretory",
    color: "#34d399",
    include: /Right renal pelvis and ureter/i,
  },
  {
    key: "kidneys",
    url: "/models/organs/kidneys.glb",
    anchor: [0, 1.105, -0.03],
    focus: [0.056, 1.105, -0.03],
    ids: ["kidney-left", "kidney-right"],
    system: "excretory",
    color: "#34d399",
    pair: true,
    flipX: true,
    nodeSide: lrSide,
    mul: 0.95,
  },
  {
    key: "skull",
    url: "/models/organs/skull.glb",
    anchor: [0, 1.601, -0.005],
    focus: [0, 1.641, 0.015],
    markerOffset: [0, 0.04, 0.02],
    ids: ["skull"],
    system: "skeletal",
    color: "#e2e8f0",
    mul: 0.9,
  },
  {
    key: "ribcage",
    url: "/models/organs/ribcage.glb",
    anchor: [0, 1.19, -0.01],
    focus: [-0.105, 1.22, 0.025],
    markerOffset: [-0.105, 0.03, 0.035],
    ids: ["ribcage"],
    system: "skeletal",
    color: "#e2e8f0",
    exclude: /sternum/i,
  },
  {
    key: "sternum",
    url: "/models/organs/ribcage.glb",
    anchor: [0, 1.19, -0.01],
    focus: [0, 1.293, 0.045],
    markerOffset: [0, 0.05, -0.018],
    ids: ["sternum"],
    system: "skeletal",
    color: "#e2e8f0",
    include: /sternum/i,
  },
  {
    key: "eye",
    url: "/models/organs/eye.glb",
    anchor: [-0.029, 1.588, 0.056],
    focus: [-0.029, 1.588, 0.056],
    ids: ["eye-right", "eye-left"],
    system: "sensory",
    color: "#f0abfc",
    mirror: true,
    flipX: true,
  },
  {
    key: "ear",
    url: "/models/organs/ear.glb",
    anchor: [-0.058, 1.584, -0.005],
    focus: [-0.058, 1.584, -0.005],
    ids: ["ear-right", "ear-left"],
    system: "sensory",
    color: "#d8b4fe",
    mirror: true,
    flipX: true,
    mul: 0.75,
  },
];

export const ORGAN_MODEL_URLS = ORGAN_UNITS.map((u) => u.url);

export const MODELED_ORGAN_IDS = new Set(ORGAN_UNITS.flatMap((u) => u.ids));

export const ORGAN_FOCUS_FALLBACK: Record<string, [number, number, number]> = {
  skull: [0, 1.641, 0.015],
  ribcage: [-0.105, 1.22, 0.025],
};

export function transformMeters(
  p: [number, number, number],
  height: number,
): [number, number, number] {
  const s = height / BODY_RAW_HEIGHT;
  return [p[0] * s, (p[1] - BODY_MIN_Y) * s, (p[2] - BODY_CENTER_Z) * s];
}

export const organScale = (height: number) => height / BODY_RAW_HEIGHT;
