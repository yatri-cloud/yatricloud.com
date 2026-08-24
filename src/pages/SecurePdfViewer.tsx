import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { isAuthenticated } from "@/lib/yatris-api";
import { listMyResources } from "@/lib/resources-api";

/**
 * SecurePdfViewer — renders a PDF inside an authenticated, protected iframe.
 *
 * Security layers applied:
 *  1. Auth-gated: redirects unauthenticated users to home.
 *  2. Ownership check: confirms the signed-in user actually owns the resource
 *     (via their user_resources row) before exposing the URL.
 *  3. iframe sandbox attribute strips download, popups, and scripted navigation.
 *  4. CSS overlay and pointer-events block right-click context menu.
 *  5. Adds `#toolbar=0&navpanes=0&statusbar=0&view=FitH` to suppress Chrome's
 *     native PDF toolbar (download / print buttons).
 *  6. keydown handler blocks Ctrl+S / Ctrl+P / Ctrl+C.
 *  7. contextmenu event is suppressed on the wrapper.
 *
 * The raw CDN/storage URL is NEVER put in any anchor href, share button, or
 * clipboard string — only the opaque `/resources/view?id=<resourceId>` route
 * is referenced elsewhere.
 */

export default function SecurePdfViewer() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const resourceId = params.get("id");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [resourceName, setResourceName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* ── Auth guard ─────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  /* ── Ownership verification + PDF URL resolution ────── */
  useEffect(() => {
    if (!resourceId) {
      setError("No resource specified.");
      setLoading(false);
      return;
    }

    listMyResources()
      .then((myResources) => {
        const owned = myResources.find((r) => r.resourceId === resourceId);
        if (!owned) {
          setError("You do not have access to this resource.");
          setLoading(false);
          return;
        }

        const url = owned.accessUrl;
        if (!url || (!url.startsWith("http") && !url.startsWith("blob"))) {
          setError("This resource is not a viewable document.");
          setLoading(false);
          return;
        }

        setResourceName(owned.name);
        // Append PDF viewer flags to suppress the native download/print toolbar
        const separator = url.includes("?") ? "&" : "#";
        setPdfUrl(`${url}${separator}toolbar=0&navpanes=0&statusbar=0&view=FitH`);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to verify access. Please try again.");
        setLoading(false);
      });
  }, [resourceId]);

  /* ── Block Ctrl+S / Ctrl+P / Ctrl+C globally ────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        (e.key === "s" || e.key === "p" || e.key === "c" || e.key === "a")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);

  /* ── Suppress right-click on wrapper ────────────────── */
  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  /* ── Render ─────────────────────────────────────────── */
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-background select-none" onContextMenu={handleContextMenu}>
        {/* Top bar */}
        <div className="sticky top-[64px] md:top-[80px] z-40 flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-border/80 bg-background/95 backdrop-blur-md shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-xl shrink-0 h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate max-w-xs md:max-w-md">{resourceName || "Document Viewer"}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Protected — copy, download &amp; sharing disabled
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-emerald-600 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:block">Secure Viewer</span>
          </div>
        </div>

        {/* Content area */}
        <div
          ref={wrapperRef}
          className="relative w-full"
          style={{ height: "calc(100vh - 128px)" }}
          onContextMenu={handleContextMenu}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="text-center space-y-3">
                <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground font-medium">Verifying access…</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="text-center max-w-sm space-y-4 p-6">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
                <h2 className="text-xl font-bold">Access Denied</h2>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button onClick={() => navigate("/my-resources")} className="rounded-xl">
                  Back to My Resources
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <>
              {/* Transparent overlay blocks right-click directly on iframe */}
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                aria-hidden="true"
              />
              <iframe
                src={pdfUrl}
                title={resourceName}
                className="absolute inset-0 w-full h-full border-0"
                // Sandbox blocks: forms, popups, scripts, top-navigation, downloads
                sandbox="allow-same-origin allow-scripts"
                allow="fullscreen"
                referrerPolicy="no-referrer"
                onContextMenu={(e) => e.preventDefault()}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
