import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import AnatomyScene, { Mode, TourTarget } from "../scenes/AnatomyScene";
import Sidebar from "../components/Sidebar";
import InfoPanel from "../components/InfoPanel";
import TourOverlay from "../components/TourOverlay";
import { Layers } from "../scenes/layers";
import { Selection } from "../scenes/selection";
import { organFocus, focusDistance } from "../scenes/focus";
import { ORGANS, SystemId } from "../data/organs";
import { TOUR, TOUR_STEP_MS } from "../data/tour";
import { useGame } from "../store/useGame";
import { useScene } from "../store/useScene";

export default function Explore() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const registerDaily = useGame((s) => s.registerDaily);
  const discover = useGame((s) => s.discover);

  const [mode, setMode] = useState<Mode>("gltf");
  const [layers, setLayers] = useState<Layers>({
    skin: false,
    muscular: false,
    skeleton: true,
    organs: true,
  });
  const initialOrgan = params.get("organ");
  const [selection, setSelection] = useState<Selection | null>(
    initialOrgan ? { kind: "organ", id: initialOrgan } : null,
  );
  const [hovered, setHovered] = useState<string | null>(null);
  const [systemFilter, setSystemFilter] = useState<SystemId | "all">("all");
  const [showLabels, setShowLabels] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [query, setQuery] = useState("");

  const sceneHeight = useScene((s) => s.height);
  const sceneXs = useScene((s) => s.xs);
  const homeTarget = useRef<TourTarget | null>(null);

  const [tourActive, setTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourPlaying, setTourPlaying] = useState(true);
  const [returning, setReturning] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useEffect(() => registerDaily(), [registerDaily]);

  const home = (m: Mode): TourTarget => ({
    focus: [0, 0.72, 0],
    dist: m === "gltf" ? 3.2 : 3.9,
  });

  const startTour = () => {
    setAutoRotate(false);
    setMobilePanelOpen(false);
    setTourIndex(0);
    setTourPlaying(true);
    setReturning(false);
    setTourActive(true);
    setSelection({ kind: "organ", id: TOUR[0].organId });
    discover(TOUR[0].organId);
  };

  const endTour = () => {
    homeTarget.current = home(mode);
    setReturning(true);
    setTourActive(false);
    window.setTimeout(() => {
      setReturning(false);
      setSelection(null);
      setParams({}, { replace: true });
    }, 950);
  };

  const gotoStep = (i: number) => {
    const clamped = Math.max(0, Math.min(TOUR.length - 1, i));
    setTourIndex(clamped);
    setSelection({ kind: "organ", id: TOUR[clamped].organId });
    discover(TOUR[clamped].organId);
  };

  useEffect(() => {
    if (!tourActive || !tourPlaying) return;
    const t = window.setTimeout(() => {
      if (tourIndex >= TOUR.length - 1) endTour();
      else gotoStep(tourIndex + 1);
    }, TOUR_STEP_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourActive, tourPlaying, tourIndex]);

  const tourTarget: TourTarget | null = returning
    ? homeTarget.current
    : tourActive
      ? (() => {
          const f = organFocus(mode, TOUR[tourIndex].organId, sceneHeight, sceneXs);
          return f ? { focus: f, dist: focusDistance(mode) } : null;
        })()
      : null;

  const tourActiveNow = tourActive || returning;

  const toggleLayer = (k: keyof Layers) =>
    setLayers((l) => ({ ...l, [k]: !l[k] }));

  const selectOrgan = (id: string) => {
    if (tourActive) {
      setTourActive(false);
      setReturning(false);
    }
    setMobilePanelOpen(false);
    setSelection({ kind: "organ", id });
    setParams({ organ: id }, { replace: true });
    discover(id);
  };

  const select = (s: Selection) => {
    if (tourActive) {
      setTourActive(false);
      setReturning(false);
    }
    setSelection(s);
    if (s.kind === "organ") {
      setParams({ organ: s.id }, { replace: true });
      discover(s.id);
    } else {
      setParams({}, { replace: true });
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setSelection(null);
    setParams({}, { replace: true });
    setLayers((l) => ({ ...l, skin: m === "organ" ? true : false }));
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ORGANS.filter(
      (o) => o.name.id.toLowerCase().includes(q) || o.name.en.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [query]);

  return (
    <div className="flex h-full min-h-0 gap-3 px-3 pb-3 sm:px-4 sm:pb-4">
      <h1 className="sr-only">Jelajah Anatomi 3D</h1>

      {/* Desktop Left Sidebar */}
      <div className="hidden w-[310px] shrink-0 lg:block">
        <Sidebar
          mode={mode}
          layers={layers}
          toggleLayer={toggleLayer}
          showLabels={showLabels}
          setShowLabels={setShowLabels}
          autoRotate={autoRotate}
          setAutoRotate={setAutoRotate}
          systemFilter={systemFilter}
          setSystemFilter={setSystemFilter}
          selected={selection?.kind === "organ" ? selection.id : null}
          onSelect={selectOrgan}
        />
      </div>

      {/* 3D Viewport Frame */}
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl">
        <AnatomyScene
          key={sceneKey}
          mode={mode}
          layers={layers}
          selected={selection}
          hovered={hovered}
          showLabels={showLabels}
          showMarkers={showMarkers}
          autoRotate={autoRotate}
          tourTarget={tourTarget}
          tourActive={tourActiveNow}
          onSelect={select}
          onHover={setHovered}
        />

        {/* Top-Left: Mode Switcher & Precision Search */}
        <div className="pointer-events-auto absolute left-3 top-3 z-10 max-w-[calc(100%-8.5rem)] sm:max-w-none flex flex-col gap-2">
          {/* Segmented Mode Control */}
          <div className="inline-flex rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 shadow-lg backdrop-blur-md">
            <ModeBtn active={mode === "gltf"} onClick={() => switchMode("gltf")}>
              🫀 Model 3D Realistis
            </ModeBtn>
            <ModeBtn active={mode === "organ"} onClick={() => switchMode("organ")}>
              🧊 Skematik Organ
            </ModeBtn>
          </div>

          {/* Search Box */}
          <div className="relative flex w-56 items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 shadow-lg backdrop-blur-md sm:w-64">
            <span className="text-xs text-slate-400" aria-hidden="true">
              🔍
            </span>
            <label htmlFor="organ-search" className="sr-only">
              Cari organ
            </label>
            <input
              id="organ-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari organ tubuh…"
              autoComplete="off"
              className="w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
            />
            <span className="sr-only" role="status">
              {query.trim() ? `${results.length} hasil pencarian` : ""}
            </span>

            {/* Quick Results Dropdown */}
            {results.length > 0 && (
              <div
                role="group"
                aria-label="Hasil pencarian organ"
                className="absolute left-0 top-full z-30 mt-1.5 w-full space-y-1 rounded-xl border border-slate-700 bg-slate-950 p-1.5 shadow-2xl"
              >
                {results.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      selectOrgan(o.id);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    <span className="font-semibold text-slate-200">{o.name.id}</span>
                    <span className="font-mono text-[10px] text-slate-400">{o.name.en}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Guided Tour Action */}
          <button
            type="button"
            onClick={startTour}
            className="flex w-56 items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-cyan-300 shadow-md backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-950/60 active:scale-[0.98] sm:w-64"
          >
            <span>▶</span>
            <span>Mulai Tur Terpandu (Guided Tour)</span>
          </button>
        </div>

        {/* Top-Right: Camera & Viewport Tools */}
        <div className="pointer-events-auto absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-1.5">
          <div className="lg:hidden">
            <CtrlBtn
              label={mobilePanelOpen ? "Tutup panel kontrol" : "Buka panel lapisan & organ"}
              pressed={mobilePanelOpen}
              onClick={() => setMobilePanelOpen((v) => !v)}
            >
              <span aria-hidden="true">🎛️</span>
            </CtrlBtn>
          </div>
          <CtrlBtn label="Reset sudut kamera" onClick={() => setSceneKey((k) => k + 1)}>
            <span aria-hidden="true">🎯</span>
          </CtrlBtn>
          <CtrlBtn
            label={autoRotate ? "Hentikan rotasi orbit" : "Putar orbit otomatis"}
            pressed={autoRotate}
            onClick={() => setAutoRotate((v) => !v)}
          >
            <span aria-hidden="true">🔄</span>
          </CtrlBtn>
          <CtrlBtn
            label={showLabels ? "Sembunyikan label 3D" : "Tampilkan label 3D"}
            pressed={showLabels}
            onClick={() => setShowLabels((v) => !v)}
          >
            <span aria-hidden="true">🏷️</span>
          </CtrlBtn>
          <CtrlBtn
            label={showMarkers ? "Sembunyikan penanda" : "Tampilkan penanda"}
            pressed={showMarkers}
            onClick={() => setShowMarkers((v) => !v)}
          >
            <span aria-hidden="true">📍</span>
          </CtrlBtn>
        </div>

        {/* Mobile Drawer */}
        {mobilePanelOpen && (
          <div className="pointer-events-auto absolute inset-y-16 right-3 z-30 w-[min(320px,90vw)] lg:hidden">
            <Sidebar
              mode={mode}
              layers={layers}
              toggleLayer={toggleLayer}
              showLabels={showLabels}
              setShowLabels={setShowLabels}
              autoRotate={autoRotate}
              setAutoRotate={setAutoRotate}
              systemFilter={systemFilter}
              setSystemFilter={setSystemFilter}
              selected={selection?.kind === "organ" ? selection.id : null}
              onSelect={selectOrgan}
            />
          </div>
        )}

        {/* Hover Organ HUD Indicator */}
        {hovered && !selection && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-slate-700/80 bg-slate-900/90 px-4 py-1.5 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md">
            <span className="text-cyan-400 mr-1.5">●</span>
            {ORGANS.find((o) => o.id === hovered)?.name.id || "Detail Organ"}
            <span className="ml-2 text-[10px] text-slate-400 font-normal">klik untuk bedah</span>
          </div>
        )}

        {/* Info Panel Dossier on Right */}
        <div className="pointer-events-none absolute inset-y-3 right-3 z-20 flex items-end sm:items-center">
          <InfoPanel
            selection={selection}
            onClose={() => {
              setSelection(null);
              setParams({}, { replace: true });
            }}
            onQuiz={(id) => navigate(`/quiz?organ=${id}`)}
          />
        </div>

        {/* Tour Overlay */}
        {tourActive && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
            <TourOverlay
              step={TOUR[tourIndex]}
              index={tourIndex}
              total={TOUR.length}
              playing={tourPlaying}
              stepMs={TOUR_STEP_MS}
              onPrev={() => gotoStep(tourIndex - 1)}
              onNext={() =>
                tourIndex >= TOUR.length - 1 ? endTour() : gotoStep(tourIndex + 1)
              }
              onToggle={() => setTourPlaying((p) => !p)}
              onClose={endTour}
            />
          </div>
        )}

        <ProgressPill />
      </div>
    </div>
  );
}

function ModeBtn({
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
      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
        active
          ? "bg-cyan-500 text-slate-950 shadow-sm"
          : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function CtrlBtn({
  children,
  onClick,
  label,
  pressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  pressed?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={`grid h-9 w-9 place-items-center rounded-xl border text-sm transition-all duration-150 shadow-sm backdrop-blur-md ${
        pressed
          ? "border-cyan-500/60 bg-cyan-950/80 text-cyan-200"
          : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
      }`}
    >
      {children}
    </motion.button>
  );
}

function ProgressPill() {
  const { discovered, studentName, openLoginModal } = useGame();
  if (!studentName) {
    return (
      <button
        type="button"
        onClick={() => openLoginModal("student")}
        title="Klik untuk Masuk Siswa"
        className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/85 px-3 py-1.5 text-xs text-slate-400 shadow-md backdrop-blur-md transition-colors hover:border-slate-700 hover:text-slate-200"
      >
        <span className="text-amber-400" aria-hidden="true">
          🔒
        </span>
        <span>
          Level Belajar: <strong className="text-slate-300">Tamu</strong>{" "}
          <span className="text-[10px] text-cyan-400 underline ml-1">Masuk Siswa</span>
        </span>
      </button>
    );
  }
  return (
    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/85 px-3 py-1.5 text-xs text-slate-300 shadow-md backdrop-blur-md">
      <span className="text-cyan-400">◆</span>
      <span className="font-semibold text-white">{discovered.length}</span>
      <span className="text-slate-400">/ {ORGANS.length} organ dibuka</span>
    </div>
  );
}
