# AnatomiVerse 3D — Workspace Guidelines & Rules

## 1. Token Efficiency & Context Economy (Strict)
- **High-Density Technical Communication**:
  - Provide direct, concise, and structured answers. Omit conversational filler, excessive pleasantries, and repetition.
  - Summarize results using concise bullet points or markdown tables.
- **Targeted File Inspection**:
  - Always use `StartLine` and `EndLine` when reading code with `read_file`. Avoid reading full multi-hundred-line files unless strictly required.
  - Use specific search patterns or greps rather than full-folder directory dumps.
- **Precise File Editing**:
  - Always use `edit_file` with exact targeted snippets rather than rewriting entire files with `write_file`.
  - Only use `write_file` when creating entirely new files.
- **Context Compaction**:
  - Proactively recommend `/compact` to the user when conversational context window begins to scale up.

---

## 2. Code Quality & Technical Stack Standards
- **Stack**: React 18, TypeScript, Tailwind CSS, Lucide React, Three.js (@react-three/fiber / canvas), Socket.io-client, Zustand.
- **Design Aesthetic**:
  - Clean, high-contrast, modern medical workstation theme (dark slate `bg-slate-950`, clinical cyan/teal accents, crisp borders `border-slate-800`).
  - Strict elimination of AI slop (no exaggerated neon purple gradients or unusable glowing cards).
- **Mobile First & UI Accessibility**:
  - All quiz cards, modal views, and interactive panels must account for small mobile screens.
  - Never wrap interactive buttons in unscrollable fixed-height cards without bottom padding (`pb-24` or `pb-28`).
  - Ensure interactive buttons are always visible or reachable with simple touch scrolling.
- **Three.js & WebGL Memory Management**:
  - Always dispose geometries, materials, and textures on component unmount or model reload to prevent GPU memory leaks and tab crashes.
- **Vite & Server Stability**:
  - Never allow server-side data mutations in `server/data/` to trigger Vite hot reload loops (handled via `server.watch.ignored` in `vite.config.ts`).
  - Backend runs on Node (`server/index.mjs`) on port 3001; frontend Vite proxy routes `/socket.io` to port 3001.

---

## 3. Git & Deployment Workflow
- **Repository**: `https://github.com/cekmemori/anatomi-game.git`
- **Main Branch**: `main`
- **Production Server**: `/var/www/anatomi-game` on `anatomi.apotiku.id` (IP: `103.191.63.252`)
- **Build Artifacts**:
  - Pre-compiled production bundle in `dist/` is tracked in git for zero-downtime, lightweight server pulls without needing remote compilation memory overhead.
  - When releasing production updates: build (`npm run build`), verify `dist/index.html`, commit, and push to `origin main`.
