import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

registerSW({ immediate: true });

try {
  if (localStorage.getItem('maxease-theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
