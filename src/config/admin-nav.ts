import {
    Award, Calendar, BookOpen, Wrench, Plus, GraduationCap, ClipboardList, Users,
    Server, Info, LayoutDashboard, List, ExternalLink, Globe, Handshake,
    CalendarClock, Star, Inbox, Receipt, CreditCard, type LucideIcon,
} from "lucide-react";

/**
 * The admin navigation, in one place. Both the sidebar (AdminLayout) and the
 * auto generated Admin Sitemap read from this, so adding a page here shows it in
 * both without touching anything else. Descriptions are used by the sitemap.
 */

export interface AdminNavItem {
    name: string;
    path: string;
    icon: LucideIcon;
    description?: string;
}

export interface AdminNavGroup {
    id: string;
    label: string;
    icon: LucideIcon;
    items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
    {
        id: "overview",
        label: "Dashboard",
        icon: LayoutDashboard,
        items: [
            { name: "Overview", path: "/admin", icon: LayoutDashboard, description: "A pulse on the platform and quick links." },
        ],
    },
    {
        id: "site-content",
        label: "Site Content",
        icon: Globe,
        items: [
            { name: "Site & Homepage", path: "/admin/site", icon: Globe, description: "Edit homepage sections, stats and site wide copy." },
            { name: "Certifications", path: "/admin/certifications", icon: Award, description: "Manage the certification catalog and exam details." },
        ],
    },
    {
        id: "events",
        label: "Events",
        icon: Calendar,
        items: [
            { name: "All Events", path: "/admin/events", icon: Calendar, description: "Create and manage community events." },
            { name: "Attendees", path: "/admin/attendees", icon: Users, description: "See who registered and mark attendance." },
            { name: "Submissions", path: "/admin/submissions", icon: ClipboardList, description: "Review event related submissions." },
        ],
    },
    {
        id: "training",
        label: "Training",
        icon: GraduationCap,
        items: [
            { name: "Course list", path: "/admin/training", icon: ClipboardList, description: "All training courses at a glance." },
            { name: "Create Course", path: "/admin/training/create", icon: BookOpen, description: "Add a new training course." },
            { name: "Enrollments", path: "/admin/enrollments", icon: Users, description: "See who enrolled and their payment status." },
            { name: "Reviews", path: "/admin/training/reviews", icon: Star, description: "Moderate learner reviews for trainings." },
            { name: "Providers", path: "/admin/providers", icon: Server, description: "Manage training providers." },
            { name: "Trainers Hub", path: "/admin/trainers", icon: Users, description: "Manage trainers and their access." },
        ],
    },
    {
        id: "mentorship",
        label: "Mentorship",
        icon: Handshake,
        items: [
            { name: "Overview", path: "/admin/mentorship/overview", icon: LayoutDashboard, description: "Mentorship activity at a glance." },
            { name: "Applications", path: "/admin/mentorship/applications", icon: Inbox, description: "Review people applying to mentor." },
            { name: "Mentors", path: "/admin/mentorship/mentors", icon: Users, description: "Manage active mentors." },
            { name: "Services", path: "/admin/mentorship/services", icon: ClipboardList, description: "Manage mentorship services and pricing." },
            { name: "Bookings", path: "/admin/mentorship/bookings", icon: CalendarClock, description: "See and manage mentorship bookings." },
            { name: "Reviews", path: "/admin/mentorship/reviews", icon: Star, description: "Moderate mentor reviews." },
        ],
    },
    {
        id: "admin-tools",
        label: "Other Tools",
        icon: Wrench,
        items: [
            { name: "Payments & Revenue", path: "/admin/payments", icon: Receipt, description: "Every receipt and revenue in one place." },
            { name: "Razorpay Invoices", path: "/admin/razorpay-invoices", icon: ExternalLink, description: "Raise invoices and view dashboard ones." },
            { name: "Transactions", path: "/admin/transactions", icon: CreditCard, description: "All payments, with refunds." },
            { name: "Udemy Management", path: "/admin/udemy", icon: GraduationCap, description: "Manage Udemy course listings." },
            { name: "Store Product", path: "/admin/products/add", icon: Plus, description: "Add a product to the store." },
            { name: "Exam Dumps", path: "/admin/exam-dumps", icon: List, description: "Manage exam dump listings." },
            { name: "Admin Guide", path: "/admin/guide", icon: Info, description: "How to run the platform, step by step." },
            { name: "Admin Sitemap", path: "/admin/sitemap", icon: List, description: "This page: a map of every admin area." },
        ],
    },
];
