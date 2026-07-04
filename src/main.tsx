import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Self-hosted variable fonts — no render-blocking Google Fonts requests.
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/bricolage-grotesque";
import "./index.css";

// After a deploy, a tab that loaded the previous build may navigate to a
// lazy route whose hashed chunk no longer exists. Vite surfaces that as
// `vite:preloadError`; one reload picks up the new build instead of showing
// a broken page. The session timestamp guards against a reload loop.
window.addEventListener("vite:preloadError", (event) => {
    const KEY = "yc:chunk-reload-at";
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last > 10_000) {
        event.preventDefault();
        sessionStorage.setItem(KEY, String(Date.now()));
        window.location.reload();
    }
});

// GoogleOAuthProvider is scoped to the two pages that use it (BecomeTrainer,
// TrainerLogin) — app-wide it loaded Google's 95 KB gsi/client everywhere.
createRoot(document.getElementById("root")!).render(<App />);
