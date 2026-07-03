import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

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

createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={googleClientId}>
        <App />
    </GoogleOAuthProvider>
);
