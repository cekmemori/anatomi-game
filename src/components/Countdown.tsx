import { useEffect, useState } from "react";

export default function Countdown({
  endsAt,
  paused,
  total,
  compact,
}: {
  endsAt: number;
  paused?: boolean;
  total?: number;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt || paused) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [endsAt, paused]);

  if (!endsAt || paused) return null;

  const remainMs = Math.max(0, endsAt - now);
  const secs = Math.ceil(remainMs / 1000);
  const pct = total && total > 0 ? Math.max(0, Math.min(100, (remainMs / total) * 100)) : null;
  const urgent = secs <= 5;

  if (compact) {
    return (
      <span
        role="timer"
        aria-live="off"
        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 font-mono text-sm font-bold ${
          urgent ? "bg-red-400/20 text-red-300" : "bg-cyan-400/15 text-cyan-200"
        }`}
        aria-label={`Sisa waktu ${secs} detik`}
      >
        <span aria-hidden="true">⏱</span> {secs}s
      </span>
    );
  }

  return (
    <div className="w-full" role="timer" aria-live="off" aria-label={`Sisa waktu ${secs} detik`}>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>Waktu</span>
        <span className={`font-mono font-bold ${urgent ? "text-red-300" : "text-cyan-300"}`}>
          {secs}s
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${
            urgent ? "bg-red-400" : "bg-gradient-to-r from-cyan-400 to-fuchsia-500"
          }`}
          style={{ width: `${pct ?? 100}%`, transition: "width 0.2s linear" }}
        />
      </div>
    </div>
  );
}
