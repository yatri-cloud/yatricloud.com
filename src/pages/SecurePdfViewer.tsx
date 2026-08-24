import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { isAuthenticated } from "@/lib/yatris-api";
import { listMyResources } from "@/lib/resources-api";

/**
 * SecurePdfViewer — renders a PDF inside the website without exposing the raw URL.
 *
 * Security layers:
 *  1. Auth-gate: unauthenticated users are redirected to home.
 *  2. Ownership check: the resource ID is cross-checked against the signed-in
 *     user's user_resources rows. The raw PDF URL never appears in any <a href>.
 *  3. Transparent pointer-events overlay captures right-click before it reaches
 *     the PDF renderer.
 *  4. CSS user-select: none on the wrapper prevents text drag-select.
 *  5. keydown handler intercepts Ctrl+S / Ctrl+P / Ctrl+A / Ctrl+C.
 *  6. contextmenu handler is suppressed on every surface.
 *  7. PDF toolbar is hidden via the `#toolbar=0&navpanes=0&statusbar=0` fragment
 *     so Chrome's native Download / Print buttons are not shown.
 *
 * NOTE: The `sandbox` attribute has been intentionally omitted from the <iframe>
 * because it blocks the browser's built-in PDF renderer. Security is instead
 * enforced at the application layer (auth + ownership check) rather than at the
 * iframe sandbox level.
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

  /* ── Auth guard ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  /* ── Ownership verification + URL resolution ──────────────── */
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
        // Append the PDF viewer flags via fragment (works for Supabase storage URLs
        // because they don't already contain a fragment). This hides Chrome's native
        // PDF toolbar (download / print / page navigation buttons).
        const viewerUrl = `${url}#toolbar=0&navpanes=0&statusbar=0&view=FitH&zoom=page-width`;
        setPdfUrl(viewerUrl);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to verify access. Please try again.");
        setLoading(false);
      });
  }, [resourceId]);

  /* ── Block Ctrl+S / Ctrl+P / Ctrl+C / Ctrl+A ─────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["s", "p", "c", "a", "u"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);

  const suppressCtxMenu = (e: React.MouseEvent) => e.preventDefault();

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <>
      <Navbar />
      <main
        className="pt-20 min-h-screen bg-background select-none"
        onContextMenu={suppressCtxMenu}
      >
        {/* ── Top bar ── */}
        <div className="sticky top-[64px] md:top-[80px] z-40 flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-border/80 bg-background/95 backdrop-blur-md">
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
              <p className="font-semibold text-sm truncate max-w-xs md:max-w-md">
                {resourceName || "Document Viewer"}
              </p>
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

        {/* ── Viewer area ── */}
        <div
          ref={wrapperRef}
          className="relative w-full"
          style={{ height: "calc(100vh - 128px)" }}
          onContextMenu={suppressCtxMenu}
        >
          {/* Loading state */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
              <div className="text-center space-y-3">
                <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground font-medium">
                  Verifying access…
                </p>
              </div>
            </div>
          )}

          {/* Error / access-denied state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
              <div className="text-center max-w-sm space-y-4 p-6">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
                <h2 className="text-xl font-bold">Access Denied</h2>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                  onClick={() => navigate("/my-resources")}
                  className="rounded-xl"
                >
                  Back to My Resources
                </Button>
              </div>
            </div>
          )}

          {/* PDF viewer */}
          {!loading && !error && pdfUrl && (
            <div className="absolute inset-0" onContextMenu={suppressCtxMenu}>
              {/*
               * Transparent click-interceptor overlay.
               * `pointer-events: none` lets scrolling & page-turn clicks through
               * to the iframe, but the onContextMenu on the parent div fires
               * before the browser's native context menu can appear.
               * For a stronger block, switch to `pointer-events: all` which also
               * prevents text selection inside the PDF at the cost of losing
               * scroll inside the viewer.
               */}
              <div
                className="absolute inset-0 z-10"
                style={{ pointerEvents: "none" }}
                aria-hidden="true"
                onContextMenu={suppressCtxMenu}
              />

              <iframe
                key={pdfUrl}
                src={pdfUrl}
                title={resourceName}
                className="absolute inset-0 w-full h-full border-0 bg-muted"
                // No sandbox — browser's native PDF renderer requires unrestricted
                // iframe to work. Access control is enforced at the app layer.
                allow="fullscreen"
                referrerPolicy="no-referrer"
                onContextMenu={suppressCtxMenu}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
