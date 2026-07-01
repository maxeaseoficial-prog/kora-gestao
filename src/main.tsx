import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// One-time nuke of the previous PWA cache so users see the new Landing.
// The old service worker had `/` cached as the login page.
const CACHE_BUST_KEY = "kora-landing-cache-bust-v1";
async function nukeStaleCaches() {
  try {
    if (localStorage.getItem(CACHE_BUST_KEY) === "1") return false;
    let didWork = false;
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        await r.unregister().catch(() => {});
        didWork = true;
      }
    }
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      for (const k of keys) {
        await caches.delete(k).catch(() => {});
        didWork = true;
      }
    }
    localStorage.setItem(CACHE_BUST_KEY, "1");
    return didWork;
  } catch {
    return false;
  }
}

nukeStaleCaches().then((didWork) => {
  if (didWork) {
    window.location.reload();
    return;
  }
  // Re-register a fresh SW that auto-updates
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

  if ("serviceWorker" in navigator) {
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }
});

try {
  if (localStorage.getItem('maxease-theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
