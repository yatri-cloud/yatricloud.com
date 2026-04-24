import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, BookOpen, Home, LogOut, Bot, Plus, GraduationCap, ClipboardList, Users, Server, Info, LayoutDashboard, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface AdminLayoutProps {
    children: ReactNode;
    onLogout: () => void;
}

const AdminLayout = ({ children, onLogout }: AdminLayoutProps) => {
    const location = useLocation();

    // Grouped Menu Items
    const menuGroups = [
        {
            id: "events",
            label: "Events",
            icon: Calendar,
            items: [
                { name: "All Events", path: "/admin/events", icon: Calendar },
                { name: "Attendees", path: "/admin/attendees", icon: Users },
                { name: "Submissions", path: "/admin/submissions", icon: ClipboardList },
            ],
        },
        {
            id: "training",
            label: "Training",
            icon: GraduationCap,
            items: [
                { name: "Course list", path: "/admin/training", icon: ClipboardList },
                { name: "Create Course", path: "/admin/training/create", icon: BookOpen },
                { name: "Enrollments", path: "/admin/enrollments", icon: Users },
                { name: "Providers", path: "/admin/providers", icon: Server },
                { name: "Trainers Hub", path: "/admin/trainers", icon: Users },
            ],
        },
        {
            id: "admin-tools",
            label: "Other Tools",
            icon: Bot,
            items: [
                { name: "Udemy Management", path: "/admin/udemy", icon: GraduationCap },
                { name: "Yatri AI", path: "/admin/ai", icon: Bot },
                { name: "Store Product", path: "/admin/products/add", icon: Plus },
                { name: "Admin Guide", path: "/admin/guide", icon: Info },
                { name: "Admin Sitemap", path: "/admin/sitemap", icon: List },
            ],
        },
    ];

    // Determine current active group to open it by default
    const currentActiveGroup = menuGroups.find(group =>
        group.items.some(item => location.pathname.startsWith(item.path))
    )?.id;

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
                    <Link
                        to="/admin"
                        className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-colors ${location.pathname === "/admin" || location.pathname === "/admin/events"
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>

                    <Accordion type="multiple" defaultValue={currentActiveGroup ? [currentActiveGroup] : []} className="w-full space-y-1">
                        {menuGroups.map((group) => {
                            const GroupIcon = group.icon;
                            // Check if group has active child
                            const isGroupActive = group.items.some(item => location.pathname.startsWith(item.path));

                            return (
                                <AccordionItem key={group.id} value={group.id} className="border-none">
                                    <AccordionTrigger className={`px-4 py-3 rounded-lg hover:bg-muted hover:no-underline transition-colors ${isGroupActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                                        <div className="flex items-center gap-3">
                                            <GroupIcon className="w-5 h-5" />
                                            <span className="text-sm">{group.label}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-2 pt-1 pl-6">
                                        <div className="space-y-1 border-l-2 border-primary/10 ml-2.5 pl-4 px-2">
                                            {group.items.map((item) => {
                                                const ItemIcon = item.icon;
                                                const active = location.pathname.startsWith(item.path);

                                                return (
                                                    <Link
                                                        key={item.path}
                                                        to={item.path}
                                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active
                                                            ? "bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-[18px] pl-4"
                                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                            }`}
                                                    >
                                                        <ItemIcon className="w-4 h-4" />
                                                        <span>{item.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
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
