import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Suspense } from "react";
import { ShieldX, Loader2 } from "lucide-react";
import AdminLogin from "./AdminLogin";
import AdminLayout from "@/components/admin/AdminLayout";
import { useTheme } from "@/components/ThemeProvider";
import { fetchMyProfile, getCachedUser, signOut } from "@/lib/auth";
import { PermissionsProvider, usePermissions } from "@/lib/permissions-context";

/** Blocks a permitted route from rendering when the user lacks access to it. */
const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const { loading, canAccess } = usePermissions();
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading…
      </div>
    );
  }
  // The dashboard landing is always allowed; every other page checks permissions.
  if (pathname === "/admin" || canAccess(pathname)) return <>{children}</>;
  return <NoAccess />;
};

const NoAccess = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center px-6">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive text-white">
      <ShieldX className="h-7 w-7" />
    </div>
    <h2 className="font-display text-xl font-bold tracking-tight">No access</h2>
    <p className="max-w-sm text-sm text-muted-foreground">
      Your role doesn't include permission to open this page. Ask a Super Admin to grant it.
    </p>
  </div>
);

const AdminDashboard = () => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
    // The local token only unlocks the shell. The live Supabase session must
    // ALSO belong to an admin, otherwise every database call runs as whoever
    // signed in last in this browser and writes fail on row level security.
    const [sessionChecked, setSessionChecked] = useState(false);
    const { setTheme } = useTheme();
    const hasSetInitialTheme = useRef(false);

    // Set dark theme once on initial admin load
    useEffect(() => {
        if (token && !hasSetInitialTheme.current) {
            setTheme("dark");
            hasSetInitialTheme.current = true;
        }
    }, [token, setTheme]);

    // Verify the live session really is an admin whenever the shell unlocks.
    useEffect(() => {
        let cancelled = false;
        if (!token) { setSessionChecked(false); return; }

        const timer = setTimeout(() => {
            if (!cancelled) setSessionChecked(true);
        }, 2500); // 2.5s maximum fallback so it never hangs

        (async () => {
            try {
                const profile = await fetchMyProfile();
                if (cancelled) return;
                if (!profile || profile.role !== "admin") {
                    // Check if cached user has admin role before logging out
                    const cached = getCachedUser();
                    if (!cached || cached.role !== "admin") {
                        await signOut().catch(() => {});
                        localStorage.removeItem('admin_token');
                        setToken(null);
                    }
                }
            } catch (err) {
                console.warn("⚠️ Admin session check error:", err);
            } finally {
                if (!cancelled) {
                    clearTimeout(timer);
                    setSessionChecked(true);
                }
            }
        })();

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [token]);

    const handleLogin = (newToken: string) => {
        localStorage.setItem('admin_token', newToken);
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        setToken(null);
    };

    if (!token) {
        return <AdminLogin onLogin={handleLogin} />;
    }

    if (!sessionChecked) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Checking your admin session</p>
                </div>
            </div>
        );
    }

    return (
        <PermissionsProvider>
            <AdminLayout onLogout={handleLogout}>
                {/* Local boundary so lazy admin pages swap INSIDE the layout —
                    without it the app-level Suspense unmounts the whole shell and
                    the sidebar loses its scroll position on every navigation. */}
                <Suspense
                    fallback={
                        <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading…
                        </div>
                    }
                >
                    <RouteGuard>
                        <Outlet />
                    </RouteGuard>
                </Suspense>
            </AdminLayout>
        </PermissionsProvider>
    );
};

export default AdminDashboard;
