import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import { Button } from "@/components/ui/button";
import { Calendar, LayoutDashboard, LogOut, GraduationCap, Plus } from "lucide-react";

const AdminDashboard = () => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
    const location = useLocation();

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

    const navItems = [
        { href: "/admin/events", label: "Events", icon: Calendar },
        { href: "/admin/udemy", label: "Udemy Coupons", icon: GraduationCap },
        { href: "/admin/products/add", label: "Add Product", icon: Plus },
    ];

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card hidden md:flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <img src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png" alt="Yatri Logo" className="w-8 h-8" />
                        Yatri Admin
                    </h2>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? "bg-primary text-primary-foreground font-medium"
                                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 border-b flex items-center justify-between px-6 bg-card md:hidden">
                    <h2 className="font-bold">Admin Dashboard</h2>
                    <Button size="sm" variant="ghost" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" />
                    </Button>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
