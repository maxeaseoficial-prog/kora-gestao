import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const shouldCleanupServiceWorker =
  "serviceWorker" in navigator &&
  (window.location.search.includes("sw=off") ||
    import.meta.env.DEV ||
    window.self !== window.top ||
    window.location.hostname.startsWith("id-preview--") ||
    window.location.hostname.startsWith("preview--") ||
    window.location.hostname === "lovableproject.com" ||
    window.location.hostname.endsWith(".lovableproject.com") ||
    window.location.hostname === "lovableproject-dev.com" ||
    window.location.hostname.endsWith(".lovableproject-dev.com") ||
    window.location.hostname === "beta.lovable.dev" ||
    window.location.hostname.endsWith(".beta.lovable.dev"));

async function cleanupStaleAppShellCache() {
  try {
    let didWork = false;
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const registration of regs) {
        const workerUrl =
          registration.active?.scriptURL ||
          registration.waiting?.scriptURL ||
          registration.installing?.scriptURL ||
          "";
        if (workerUrl.endsWith("/sw.js") || workerUrl.endsWith("/service-worker.js")) {
          await registration.unregister().catch(() => {});
          didWork = true;
        }
      }
    }
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      for (const key of keys) {
        if (/(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(key)) {
          await caches.delete(key).catch(() => {});
          didWork = true;
        }
      }
    }
    return didWork;
  } catch {
    return false;
  }
}

if (shouldCleanupServiceWorker) {
  cleanupStaleAppShellCache().then((didWork) => {
    // Não force reload: isso derruba janelas/modais abertos quando o usuário volta para a aba.
  });
}

try {
  if (localStorage.getItem('maxease-theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
