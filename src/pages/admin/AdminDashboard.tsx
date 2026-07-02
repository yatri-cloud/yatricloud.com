import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AdminLogin from "./AdminLogin";
import AdminLayout from "@/components/admin/AdminLayout";
import { useTheme } from "@/components/ThemeProvider";
import { fetchMyProfile, signOut } from "@/lib/auth";

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
        (async () => {
            const profile = await fetchMyProfile();
            if (cancelled) return;
            if (!profile || profile.role !== "admin") {
                // A non admin session (for example a test account used on the
                // public site) took over this browser. Force a fresh admin login.
                await signOut();
                localStorage.removeItem('admin_token');
                setToken(null);
            }
            setSessionChecked(true);
        })();
        return () => { cancelled = true; };
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
        <AdminLayout onLogout={handleLogout}>
            <Outlet />
        </AdminLayout>
    );
};

export default AdminDashboard;
