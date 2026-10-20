export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="aurora-blob"
        style={{
          width: 620,
          height: 620,
          top: "-14%",
          left: "-8%",
          background:
            "radial-gradient(circle at 30% 30%, rgba(34,211,238,0.5), transparent 62%)",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 680,
          height: 680,
          bottom: "-22%",
          right: "-10%",
          background:
            "radial-gradient(circle at 60% 40%, rgba(168,85,247,0.45), transparent 62%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 460,
          height: 460,
          top: "30%",
          left: "42%",
          background:
            "radial-gradient(circle, rgba(251,113,133,0.22), transparent 65%)",
          animationDelay: "-11s",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
    </div>
  );
}
