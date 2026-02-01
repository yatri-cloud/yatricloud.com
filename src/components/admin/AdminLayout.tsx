import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, BookOpen, Home, LogOut, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout, isAuthenticated } from "@/lib/yatris-api";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminLayoutProps {
    children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Check authentication
    useEffect(() => {
        if (!isAuthenticated()) {
            navigate("/");
        }
    }, [navigate]);

    const handleLogout = () => {
        logout();
        toast({
            title: "Logged Out",
            description: "You have been logged out successfully",
        });
        navigate("/");
    };

    const menuItems = [
        {
            name: "Events",
            path: "/admin/events",
            icon: Calendar,
        },
        {
            name: "Udemy",
            path: "/admin/udemy",
            icon: BookOpen,
        },
        {
            name: "Yatri AI",
            path: "/admin/ai",
            icon: Bot,
        },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border flex flex-col">
                {/* Logo/Home */}
                <div className="p-6 border-b border-border">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Home className="w-6 h-6 text-primary" />
                        <span className="font-bold text-lg">Yatri Admin</span>
                    </Link>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-4">
                    <div className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

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

                {/* Logout Button & Theme */}
                <div className="p-4 border-t border-border space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-sm font-medium text-muted-foreground">Theme</span>
                        <ThemeToggle />
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
