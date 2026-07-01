import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Force update of any stale service worker (previous cached build)
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      registration.update().catch(() => {});
      setInterval(() => registration.update().catch(() => {}), 60 * 1000);
    }
  },
});

// If a new SW takes control, reload once so the user gets the fresh app
if ("serviceWorker" in navigator) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}

try {
  if (localStorage.getItem('maxease-theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
