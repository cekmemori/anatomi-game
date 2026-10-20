import React from "react";

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    console.error("3D scene error:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="grid h-full w-full place-items-center text-center text-sm text-muted"
          >
            <div>
              <div className="mb-2 text-3xl" aria-hidden="true">🧊</div>
              Tampilan 3D tidak dapat dimuat di perangkat ini.
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
