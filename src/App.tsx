import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useLocation,
  useRouteError,
} from "react-router-dom";
import { ComponentType, Suspense, lazy, useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import Background from "./components/Background";
import TopBar from "./components/TopBar";
import Toasts from "./components/Toasts";
import PwaBanner from "./components/PwaBanner";
import SessionBanner from "./components/SessionBanner";
import TeacherGate from "./components/TeacherGate";
import StudentLoginModal from "./components/StudentLoginModal";
import StudentGate from "./components/StudentGate";
import { bindSession } from "./store/useSession";

function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem("anatomi:chunk-reload");
      return mod;
    } catch (err) {
      const reloaded = sessionStorage.getItem("anatomi:chunk-reload");
      if (!reloaded) {
        sessionStorage.setItem("anatomi:chunk-reload", "1");
        window.location.reload();
        return { default: (() => null) as unknown as T };
      }
      throw err;
    }
  });
}

function RouteError() {
  const err = useRouteError();
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const isChunkErr = /dynamically imported module|Importing a module script failed|fetch/i.test(
    msg,
  );

  useEffect(() => {
    if (isChunkErr && !sessionStorage.getItem("anatomi:chunk-reload")) {
      sessionStorage.setItem("anatomi:chunk-reload", "1");
      window.location.reload();
    }
  }, [isChunkErr]);

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <div className="glass max-w-md rounded-2xl p-6 text-center">
        <h1 className="text-lg font-bold text-white">Memperbarui Aplikasi…</h1>
        <p className="mt-2 text-sm text-muted">
          Versi baru aplikasi telah tersedia. Silakan muat ulang halaman untuk melanjutkan.
        </p>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem("anatomi:chunk-reload");
            window.location.reload();
          }}
          className="mt-4 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg"
        >
          Muat Ulang Sekarang
        </button>
      </div>
    </div>
  );
}

const Landing = lazyWithRetry(() => import("./pages/Landing"));
const Explore = lazyWithRetry(() => import("./pages/Explore"));
const Missions = lazyWithRetry(() => import("./pages/Missions"));
const QuizPage = lazyWithRetry(() => import("./pages/Quiz"));
const Achievements = lazyWithRetry(() => import("./pages/Achievements"));
const Teacher = lazyWithRetry(() => import("./pages/Teacher"));
const Join = lazyWithRetry(() => import("./pages/Join"));
const Play = lazyWithRetry(() => import("./pages/Play"));
const Host = lazyWithRetry(() => import("./pages/Host"));

const PAGE_TITLES: Record<string, string> = {
  "/": "Beranda",
  "/explore": "Jelajah 3D",
  "/missions": "Misi Temukan Organ",
  "/quiz": "Kuis Anatomi",
  "/achievements": "Pencapaian",
  "/teacher": "Rekap Guru",
  "/join": "Gabung Sesi",
  "/play": "Sesi Kuis Siswa",
  "/host": "Host Sesi Kuis",
};

function PageLoader() {
  return (
    <div className="grid h-full min-h-[50vh] place-items-center">
      <div className="flex items-center gap-2 text-sm text-muted" role="status">
        <span className="h-2 w-2 animate-ping rounded-full bg-cyan-300" aria-hidden="true" />
        Memuat…
      </div>
    </div>
  );
}

function Root() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => bindSession(), []);

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] ?? "Beranda";
    document.title = `${title} · AnatomiVerse 3D`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus();
    setAnnouncement(`Halaman ${title}`);
  }, [location.pathname]);

  return (
    <div className="relative flex h-full flex-col">
      <Background />
      <TopBar />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="relative z-10 min-h-0 flex-1 outline-none"
      >
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <Toasts />
      <SessionBanner />
      <PwaBanner />
      <StudentLoginModal />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Landing /> },
      { path: "explore", element: <Explore /> },
      {
        path: "missions",
        element: (
          <StudentGate featureName="Misi Temukan Organ">
            <Missions />
          </StudentGate>
        ),
      },
      {
        path: "quiz",
        element: (
          <StudentGate featureName="Kuis Anatomi">
            <QuizPage />
          </StudentGate>
        ),
      },
      { path: "achievements", element: <Achievements /> },
      {
        path: "teacher",
        element: (
          <TeacherGate>
            <Teacher />
          </TeacherGate>
        ),
      },
      {
        path: "join",
        element: (
          <StudentGate featureName="Gabung Sesi Kuis">
            <Join />
          </StudentGate>
        ),
      },
      {
        path: "play",
        element: (
          <StudentGate featureName="Sesi Kuis Siswa">
            <Play />
          </StudentGate>
        ),
      },
      {
        path: "host",
        element: (
          <TeacherGate>
            <Host />
          </TeacherGate>
        ),
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  );
}
