import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import AdminLayout from "@/components/admin/AdminLayout";
import { useTheme } from "@/components/ThemeProvider";

const AdminDashboard = () => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
    const { setTheme } = useTheme();
    const hasSetInitialTheme = useRef(false);

    // Set dark theme once on initial admin load
    useEffect(() => {
        if (token && !hasSetInitialTheme.current) {
            setTheme("dark");
            hasSetInitialTheme.current = true;
        }
    }, [token, setTheme]);

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

    return (
        <AdminLayout onLogout={handleLogout}>
            <Outlet />
        </AdminLayout>
    );
};

export default AdminDashboard;
