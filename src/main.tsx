import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { usePwa } from "./store/usePwa";
import "./index.css";

let refreshing = false;
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  if (!refreshing) {
    refreshing = true;
    window.location.reload();
  }
});

const updateSW = registerSW({
  immediate: true,
  onOfflineReady() {
    usePwa.getState().setOfflineReady(true);
  },
  onNeedRefresh() {
    usePwa.getState().setNeedRefresh(true);
    updateSW(true);
  },
});
usePwa.getState().setUpdateSW(updateSW);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
