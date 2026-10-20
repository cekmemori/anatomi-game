import { motion } from "framer-motion";
import { ORGANS, SYSTEMS, SystemId } from "../data/organs";
import { useGame } from "../store/useGame";
import { Layers } from "../scenes/layers";

const LAYER_META: { key: keyof Layers; label: string; icon: string; color: string }[] = [
  { key: "skin", label: "Kulit", icon: "🧍", color: "#64748b" },
  { key: "muscular", label: "Otot", icon: "💪", color: "#f43f5e" },
  { key: "skeleton", label: "Rangka", icon: "🦴", color: "#e2e8f0" },
  { key: "organs", label: "Organ", icon: "🫀", color: "#06b6d4" },
];

function Toggle({
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
      className={`relative flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all duration-200 ${
        active
          ? "border-cyan-500/40 bg-cyan-950/40 text-slate-100 shadow-sm"
          : "border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
      }`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
          active ? "bg-cyan-500" : "bg-slate-700/60"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 35 }}
          className="inline-block h-3 w-3 translate-y-0.5 rounded-full bg-white shadow-sm"
          style={{ marginLeft: active ? 18 : 2 }}
        />
      </span>
    </button>
  );
}

export default function Sidebar({
  mode,
  layers,
  toggleLayer,
  showLabels,
  setShowLabels,
  autoRotate,
  setAutoRotate,
  systemFilter,
  setSystemFilter,
  selected,
  onSelect,
}: {
  mode: "gltf" | "organ";
  layers: Layers;
  toggleLayer: (k: keyof Layers) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  autoRotate: boolean;
  setAutoRotate: (v: boolean) => void;
  systemFilter: SystemId | "all";
  setSystemFilter: (v: SystemId | "all") => void;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const { discovered } = useGame();
  const list = ORGANS.filter(
    (o) => systemFilter === "all" || o.system === systemFilter,
  );
  const systemsWithOrgans = Object.values(SYSTEMS).filter((s) =>
    ORGANS.some((o) => o.system === s.id),
  );

  return (
    <aside
      aria-label="Panel kontrol model 3D"
      className="flex h-full w-full flex-col gap-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl backdrop-blur-md"
    >
      {/* Header title */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Kontrol Lapisan & Sistem
          </h2>
        </div>
        <span className="font-mono text-[10px] text-slate-500">LAYER_OPS</span>
      </div>

      {/* Layer Toggles */}
      <section>
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Lapisan Tubuh</span>
          <span className="text-[10px] text-slate-500">Klik toggle</span>
        </div>
        {(() => {
          const visibleLayers = LAYER_META.filter(
            (l) => l.key !== "skin" && !(mode === "organ" && l.key === "muscular"),
          );
          return (
            <div
              className={`grid gap-2 ${
                visibleLayers.length === 3 ? "grid-cols-3" : "grid-cols-2"
              }`}
            >
              {visibleLayers.map((l) => {
                const isLayerActive = layers[l.key];
                return (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => toggleLayer(l.key)}
                    aria-pressed={isLayerActive}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-2 text-left transition-all duration-150 ${
                      isLayerActive
                        ? "border-slate-600 bg-slate-900/90 text-slate-100 shadow-sm"
                        : "border-slate-800/70 bg-slate-900/20 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                    }`}
                  >
                    <span className="text-sm" aria-hidden="true">{l.icon}</span>
                    <span className="truncate text-xs font-semibold">{l.label}</span>
                    <span
                      aria-hidden="true"
                      className="h-1 w-full rounded-full transition-all duration-200"
                      style={{
                        background: isLayerActive ? l.color : "rgba(100, 116, 139, 0.2)",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* Viewport Toggles */}
      <section>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Orientasi Kamera
        </div>
        <div className="flex flex-col gap-1.5">
          <Toggle active={showLabels} onClick={() => setShowLabels(!showLabels)}>
            <span>🏷️ Tampilkan Label Organ</span>
          </Toggle>
          <Toggle active={autoRotate} onClick={() => setAutoRotate(!autoRotate)}>
            <span>🔄 Rotasi Orbit Otomatis</span>
          </Toggle>
        </div>
      </section>

      {/* Organ List Section */}
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Katalog Organ ({list.length})</span>
          <span className="text-[10px] text-slate-500 font-mono">
            {discovered.length} ditemukan
          </span>
        </div>

        {/* Filter chips */}
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          <Chip
            active={systemFilter === "all"}
            onClick={() => setSystemFilter("all")}
          >
            Semua
          </Chip>
          {systemsWithOrgans.map((s) => (
            <Chip
              key={s.id}
              active={systemFilter === s.id}
              onClick={() => setSystemFilter(s.id)}
            >
              {s.icon} {s.name.replace("Sistem ", "")}
            </Chip>
          ))}
        </div>

        {/* Organ item scroll list */}
        <div className="-mr-1.5 flex-1 space-y-1 overflow-y-auto pr-1.5">
          {list.map((o) => {
            const seen = discovered.includes(o.id);
            const active = selected === o.id;
            const sysColor = SYSTEMS[o.system]?.color || "#06b6d4";

            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onSelect(o.id)}
                aria-pressed={active}
                className={`group flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-all duration-150 ${
                  active
                    ? "border-cyan-500/60 bg-cyan-950/40 text-cyan-100 shadow-sm"
                    : "border-transparent bg-slate-900/30 text-slate-300 hover:border-slate-800 hover:bg-slate-900/70"
                }`}
              >
                {/* Organ system color accent dot */}
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px]"
                  style={{
                    backgroundColor: `${sysColor}20`,
                    color: sysColor,
                    border: `1px solid ${sysColor}40`,
                  }}
                >
                  {SYSTEMS[o.system]?.icon || "🫀"}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold group-hover:text-white">
                    {o.name.id}
                  </span>
                  <span className="block truncate text-[10px] text-slate-400">
                    {o.name.en}
                  </span>
                </span>

                {/* Discovery badge */}
                <span className="text-[11px]">
                  {seen ? (
                    <span className="text-emerald-400" title="Organ sudah dipelajari">✓</span>
                  ) : (
                    <span className="text-slate-600" title="Belum dibuka">○</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
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
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
        active
          ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-200 shadow-sm"
          : "border-slate-800/90 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
