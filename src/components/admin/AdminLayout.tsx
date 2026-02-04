import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, BookOpen, Home, LogOut, Bot, Plus, GraduationCap, ClipboardList, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminLayoutProps {
    children: ReactNode;
    onLogout: () => void;
}

const AdminLayout = ({ children, onLogout }: AdminLayoutProps) => {
    const location = useLocation();

    const menuItems = [
        {
            name: "Events",
            path: "/admin/events",
            icon: Calendar,
        },
        {
            name: "Attendees",
            path: "/admin/attendees",
            icon: Users,
        },
        {
            name: "Submissions",
            path: "/admin/submissions",
            icon: ClipboardList,
        },
        {
            name: "Udemy Coupons",
            path: "/admin/udemy",
            icon: GraduationCap,
        },
        {
            name: "Yatri AI",
            path: "/admin/ai",
            icon: Bot,
        },
        {
            name: "Add Product",
            path: "/admin/products/add",
            icon: Plus,
        },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border flex flex-col flex-shrink-0 z-20">
                {/* Logo/Home */}
                <div className="p-6 h-16 flex items-center border-b border-border">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <img src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png" alt="Yatri Logo" className="w-8 h-8" />
                        <span className="font-bold text-lg">Yatri Admin</span>
                    </Link>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            // Check if path starts with item path (for sub-routes handling if any)
                            // But exact match is better for top level unless nested
                            const active = location.pathname.startsWith(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-border">
                    <Button
                        onClick={onLogout}
                        variant="outline"
                        className="w-full flex items-center gap-2 text-destructive hover:bg-destructive/10 border-destructive/20"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Fixed Header */}
                <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        {/* Left side - can add breadcrumbs or page title here if needed */}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Profile & Theme Toggle on Right */}
                        <ThemeToggle />
                        <div className="h-6 w-px bg-border mx-2" />
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium hidden sm:block">Admin</span>
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
